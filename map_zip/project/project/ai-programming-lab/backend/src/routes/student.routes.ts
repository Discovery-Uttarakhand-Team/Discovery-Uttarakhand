import { Router } from "express";
import { Role } from "@prisma/client";
import { getStudentDashboard } from "../controllers/student.controller";
import { authenticate } from "../middleware/authenticate";
import { requireRole } from "../middleware/requireRole";

const router = Router();

router.use(authenticate);
router.use(requireRole(Role.STUDENT));

router.get("/dashboard", getStudentDashboard);

export default router;