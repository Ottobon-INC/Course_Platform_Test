import express from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { asyncHandler } from "../utils/asyncHandler";
import { addItemToCart, clearCartForUser, getCartForUser, removeItemFromCart, } from "../services/cartService";
const addCourseSchema = z.object({
    course: z.object({
        id: z.string().min(1).max(191),
        title: z.string().min(1).max(255),
        price: z.number().int().nonnegative(),
        description: z.string().max(2000).optional(),
        instructor: z.string().max(255).optional(),
        duration: z.string().max(255).optional(),
        rating: z.number().min(0).max(5).optional(),
        students: z.number().int().nonnegative().optional(),
        level: z.string().max(100).optional(),
        thumbnail: z.string().max(2048).optional(),
    }),
});
const cartRouter = express.Router();
cartRouter.use(requireAuth);
cartRouter.get("/", asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const items = await getCartForUser(auth.userId);
    res.status(200).json({ items });
}));
cartRouter.post("/", asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const parsed = addCourseSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({
            message: "Invalid course payload",
            errors: parsed.error.flatten(),
        });
        return;
    }
    const items = await addItemToCart(auth.userId, parsed.data.course);
    res.status(200).json({ items });
}));
cartRouter.delete("/items/:courseSlug", asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    const courseSlug = req.params.courseSlug?.trim();
    if (!courseSlug) {
        res.status(400).json({ message: "courseSlug is required" });
        return;
    }
    const items = await removeItemFromCart(auth.userId, courseSlug);
    res.status(200).json({ items });
}));
cartRouter.delete("/", asyncHandler(async (req, res) => {
    const auth = req.auth;
    if (!auth) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    await clearCartForUser(auth.userId);
    res.status(204).send();
}));
export { cartRouter };
