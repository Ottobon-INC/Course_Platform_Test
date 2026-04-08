import express from "express";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";

const blogsRouter = express.Router();

// Fetch all blogs from cp_blogs
blogsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
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

// Fetch a single blog by SLUG (primary) or UUID (fallback for backward compat)
blogsRouter.get(
  "/:identifier",
  asyncHandler(async (req, res) => {
    const { identifier } = req.params;

    try {
      let blog: any[] = [];

      // Check if identifier looks like a UUID (uuid v4 pattern)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

      if (uuidRegex.test(identifier)) {
        // Legacy UUID-based lookup
        blog = await prisma.$queryRaw`
          SELECT * FROM cp_blogs 
          WHERE id = ${identifier}::uuid
          LIMIT 1
        `;
      } else {
        // New slug-based lookup
        blog = await prisma.$queryRaw`
          SELECT * FROM cp_blogs 
          WHERE slug = ${identifier}
          LIMIT 1
        `;
      }

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
