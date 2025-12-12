export function requireTutor(req, res, next) {
    const auth = req.auth;
    if (!auth?.role || auth.role !== "tutor") {
        res.status(403).json({ message: "Tutor access required" });
        return;
    }
    next();
}
export function requireAdmin(req, res, next) {
    const auth = req.auth;
    if (!auth?.role || auth.role !== "admin") {
        res.status(403).json({ message: "Admin access required" });
        return;
    }
    next();
}
