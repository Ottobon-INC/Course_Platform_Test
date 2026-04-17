import express from "express";
import { prisma } from "../services/prisma";
import { asyncHandler } from "../utils/asyncHandler";
const sitemapRouter = express.Router();
const BASE_URL = "https://learn.ottobon.in";
// GET /sitemap.xml — Dynamic sitemap for all blog pages + static pages
sitemapRouter.get("/", asyncHandler(async (req, res) => {
    try {
        // Fetch all blogs that have a slug
        const blogs = await prisma.$queryRaw `
        SELECT slug, id, created_at
        FROM cp_blogs
        WHERE slug IS NOT NULL AND slug != ''
        ORDER BY created_at DESC
      `;
        // Static pages with their priority and change frequency
        const staticPages = [
            { url: "/", priority: "1.0", changefreq: "weekly" },
            { url: "/blogs", priority: "0.9", changefreq: "daily" },
            { url: "/our-courses/cohort", priority: "0.8", changefreq: "weekly" },
            { url: "/our-courses/on-demand", priority: "0.8", changefreq: "weekly" },
            { url: "/our-courses/workshops", priority: "0.8", changefreq: "weekly" },
            { url: "/methodology", priority: "0.7", changefreq: "monthly" },
            { url: "/become-a-tutor", priority: "0.6", changefreq: "monthly" },
        ];
        // Build XML
        const staticUrls = staticPages
            .map((page) => `
  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`)
            .join("");
        const blogUrls = blogs
            .map((blog) => {
            const lastmod = blog.created_at
                ? new Date(blog.created_at).toISOString().split("T")[0]
                : new Date().toISOString().split("T")[0];
            return `
  <url>
    <loc>${BASE_URL}/blogs/${blog.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
        })
            .join("");
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${staticUrls}
${blogUrls}
</urlset>`;
        res.header("Content-Type", "application/xml");
        res.header("Cache-Control", "public, max-age=3600"); // cache for 1 hour
        res.status(200).send(xml);
    }
    catch (error) {
        console.error("Error generating sitemap:", error);
        res.status(500).send("Failed to generate sitemap");
    }
}));
export { sitemapRouter };
