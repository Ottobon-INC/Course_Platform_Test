import express from "express";
import { requireAuth, type AuthenticatedRequest } from "../middleware/requireAuth";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";
import multer from "multer";
import { supabase } from "../services/supabase";

export const usersRouter = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  }
});

usersRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth;
    if (!auth) {
      res.status(401).json({ message: "Unauthorized" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { userId: auth.userId },
      select: {
        userId: true,
        email: true,
        fullName: true,
        phone: true,
        profilePhotoUrl: true,
        skills: true,
        theme: true,
        language: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      user: {
        id: user.userId,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        profilePhotoUrl: user.profilePhotoUrl,
        skills: user.skills,
        theme: user.theme,
        language: user.language,
        createdAt: user.createdAt.toISOString(),
      },
    });
  }),
);

usersRouter.patch(
  "/profile",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    const { phone, skills, theme, language } = req.body;

    // We only allow updating these specific fields
    const updateData: any = {};
    if (phone !== undefined) updateData.phone = phone;
    if (skills !== undefined) updateData.skills = skills;
    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;

    const user = await prisma.user.update({
      where: { userId: auth.userId },
      data: updateData,
    });

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: user.userId,
        phone: user.phone,
        skills: user.skills,
        theme: user.theme,
        language: user.language,
      },
    });
  }),
);

usersRouter.post(
  "/profile/photo",
  requireAuth,
  upload.single("photo"),
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    
    if (!req.file) {
      res.status(400).json({ message: "No photo uploaded" });
      return;
    }

    // --- Supabase Upload Logic ---
    const fileExt = req.file.originalname.split('.').pop();
    const fileName = `profile-${auth.userId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('Payment_images') // Using existing bucket for now as we don't have a specific one
      .upload(filePath, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      res.status(500).json({ message: "Failed to upload photo to storage" });
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('Payment_images')
      .getPublicUrl(filePath);

    // Update database
    await prisma.user.update({
      where: { userId: auth.userId },
      data: { profilePhotoUrl: publicUrl },
    });

    res.status(200).json({
      message: "Photo updated successfully",
      profilePhotoUrl: publicUrl,
    });
  }),
);
