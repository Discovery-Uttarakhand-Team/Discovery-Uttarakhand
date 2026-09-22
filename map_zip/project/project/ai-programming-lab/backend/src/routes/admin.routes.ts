import { Router } from "express";
import { Role } from "@prisma/client";
import { getAdminDashboard } from "../controllers/admin.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.ADMIN));

router.get("/dashboard", getAdminDashboard);

export default router;