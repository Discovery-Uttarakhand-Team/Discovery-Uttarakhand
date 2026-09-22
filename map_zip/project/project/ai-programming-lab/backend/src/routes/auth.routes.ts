import { Router } from "express";
import {
    register,
    login,
    logout,
    refreshToken,
    getCurrentUser,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
} from "../validators/auth.validator";

const router = Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", validate(refreshTokenSchema), refreshToken);
router.get("/me", authenticate, getCurrentUser);

export default router;