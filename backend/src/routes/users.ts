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

usersRouter.get(
  "/leaderboard/summary",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;
    
    // 1. Get current user stats
    const currentUser = await prisma.user.findUnique({
      where: { userId: auth.userId },
      select: { 
        userId: true, 
        fullName: true, 
        totalPoints: true, 
        previousRank: true,
        profilePhotoUrl: true,
      }
    });

    if (!currentUser) {
       res.status(404).json({ message: "User not found" });
       return;
    }

    // 1.5. Find all users who are in the same Course as the current user (across all batches)
    const userMemberships = await prisma.cohortMember.findMany({
      where: { userId: auth.userId },
      include: { cohort: { include: { offering: true } } }
    });
    
    let peerUserIds: string[] = [];
    if (userMemberships.length > 0) {
      const courseIds = userMemberships.map(m => m.cohort.offering.courseId);
      
      const peers = await prisma.cohortMember.findMany({
        where: { 
          cohort: { offering: { courseId: { in: courseIds } } },
          userId: { not: null }
        },
        select: { userId: true }
      });
      peerUserIds = Array.from(new Set(peers.map(p => p.userId!).filter(id => id !== null)));
    }

    // Fallback: if no peers found (shouldn't happen for self), use global
    const peerFilter = peerUserIds.length > 0 ? { userId: { in: peerUserIds } } : {};

    // 2. Calculate Current Rank (among peers)
    const rank = await prisma.user.count({
      where: { 
        ...peerFilter,
        totalPoints: { gt: currentUser.totalPoints } 
      }
    }) + 1;

    // 3. Get Peer Average (Points)
    const avgData = await prisma.user.aggregate({
      where: peerFilter,
      _avg: { totalPoints: true }
    });
    const classAverage = Math.round(avgData._avg.totalPoints || 0);

    // 4. Calculate Streak (simplified from LearnerActivityEvent)
    // We check how many consecutive days (including today/yesterday) the user was active
    const activityEvents = await prisma.learnerActivityEvent.findMany({
      where: { userId: auth.userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
      take: 100 // Look back at last 100 events
    });

    const activeDates = new Set(activityEvents.map(e => e.createdAt.toISOString().split('T')[0]));
    const sortedDates = Array.from(activeDates).sort((a, b) => b.localeCompare(a));
    
    let streak = 0;
    if (sortedDates.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      
      // If active today or yesterday, start counting
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        streak = 1;
        for (let i = 0; i < sortedDates.length - 1; i++) {
          const current = new Date(sortedDates[i]);
          const prev = new Date(sortedDates[i+1]);
          const diffDays = (current.getTime() - prev.getTime()) / (1000 * 3600 * 24);
          
          if (diffDays <= 1.1) { // 1.1 to account for slight timing variances
            streak++;
          } else {
            break;
          }
        }
      }
    }

    // 5. Target Milestone Logic (Tiered System)
    // 25->20, 20->15, 15->10, 10->5, 5->1
    let nextMilestoneRank = 1;
    if (rank > 5) {
      nextMilestoneRank = Math.floor((rank - 1) / 5) * 5;
    } else if (rank === 1) {
      nextMilestoneRank = 0; // Already at the top
    } else {
      nextMilestoneRank = 1;
    }

    let pointsToNextMilestone = 0;
    if (nextMilestoneRank > 0) {
      const milestoneUser = await prisma.user.findFirst({
        where: peerFilter,
        orderBy: { totalPoints: 'desc' },
        skip: nextMilestoneRank - 1,
        take: 1,
        select: { totalPoints: true }
      });
      if (milestoneUser) {
        pointsToNextMilestone = Math.max(0, milestoneUser.totalPoints - currentUser.totalPoints);
      }
    }

    res.status(200).json({
      fullName: currentUser.fullName,
      rank,
      previousRank: currentUser.previousRank,
      totalPoints: currentUser.totalPoints,
      classAverage,
      streak,
      profilePhotoUrl: currentUser.profilePhotoUrl,
      nextMilestoneRank,
      pointsToNextMilestone,
    });
  })
);

usersRouter.get(
  "/leaderboard/top",
  requireAuth,
  asyncHandler(async (req, res) => {
    const auth = (req as AuthenticatedRequest).auth!;

    // Get peers from the same Course (across all batches)
    const userMemberships = await prisma.cohortMember.findMany({
      where: { userId: auth.userId },
      include: { cohort: { include: { offering: true } } }
    });
    
    let peerUserIds: string[] = [];
    if (userMemberships.length > 0) {
      const courseIds = userMemberships.map(m => m.cohort.offering.courseId);
      
      const peers = await prisma.cohortMember.findMany({
        where: { 
          cohort: { offering: { courseId: { in: courseIds } } },
          userId: { not: null }
        },
        select: { userId: true }
      });
      peerUserIds = Array.from(new Set(peers.map(p => p.userId!).filter(id => id !== null)));
    }

    const peerFilter = peerUserIds.length > 0 ? { userId: { in: peerUserIds } } : {};
    
    const topUsers = await prisma.user.findMany({
      where: peerFilter,
      orderBy: { totalPoints: 'desc' },
      take: 25,
      select: {
        userId: true,
        fullName: true,
        totalPoints: true,
        profilePhotoUrl: true,
      }
    });

    const results = topUsers.map((u, i) => ({
      rank: i + 1,
      name: u.fullName,
      score: u.totalPoints,
      avatar: u.profilePhotoUrl,
      isCurrentUser: u.userId === auth.userId,
      progress: Math.min(100, Math.round((u.totalPoints / 5000) * 100)) // Scaled progress
    }));

    res.status(200).json(results);
  })
);
