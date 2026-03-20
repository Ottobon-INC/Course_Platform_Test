import express from "express";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";

const blogsRouter = express.Router();

// Fetch all blogs from cp_blogs
blogsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      // Use raw query to bypass Prisma client generation issues for new tables
      const blogs = await prisma.$queryRaw`
        SELECT * FROM cp_blogs 
        ORDER BY created_at DESC
      `;
      res.status(200).json(blogs);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      res.status(500).json({ message: "Failed to fetch blogs" });
    }
  })
);

// Fetch a single blog by ID
blogsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
      const blog: any[] = await prisma.$queryRaw`
        SELECT * FROM cp_blogs 
        WHERE id = ${id}::uuid
        LIMIT 1
      `;
      
      if (!blog || blog.length === 0) {
        res.status(404).json({ message: "Blog not found" });
        return;
      }
      
      res.status(200).json(blog[0]);
    } catch (error) {
      console.error("Error fetching blog:", error);
      res.status(500).json({ message: "Failed to fetch blog" });
    }
  })
);

export { blogsRouter };
