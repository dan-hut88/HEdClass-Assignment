import express from "express";
import * as authController from "../controllers/authController.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

router.get("/", authController.getSignin);
router.post("/", authController.login);
router.get("/logout", authController.logout);

router.get("/select-degree", requireRole("classifications officer"), authController.getSelectDegree);
router.post("/select-degree", requireRole("classifications officer"), authController.postSelectDegree);

export default router;
