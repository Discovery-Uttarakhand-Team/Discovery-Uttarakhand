import { Router } from "express";
import { Role } from "@prisma/client";
import { getTeacherDashboard } from "../controllers/teacher.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.TEACHER));

router.get("/dashboard", getTeacherDashboard);

export default router;