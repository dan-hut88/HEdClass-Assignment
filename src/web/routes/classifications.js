import express from "express";
import * as classificationsController from "../controllers/classificationsController.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// Every classifications route requires the classifications officer role.
router.use(requireRole("classifications officer"));

router.get("/", classificationsController.getDashboard);
router.get("/export", classificationsController.exportCsv);

router.get("/students/add", classificationsController.getAddStudent);
router.post("/students/add", classificationsController.postAddStudent);

router.get("/students/:id/review", classificationsController.getReviewStudent);
router.post("/students/:id/review", classificationsController.postReviewStudent);

router.get("/students/:id", classificationsController.getStudent);
router.get("/students/:id/edit", classificationsController.getEditStudent);
router.post("/students/:id/edit", classificationsController.postEditStudent);
router.post("/students/:id/delete", classificationsController.deleteStudent);
router.post("/students/:id/reopen", classificationsController.reopenStudent);

router.post("/run", classificationsController.runClassifications);

export default router;
