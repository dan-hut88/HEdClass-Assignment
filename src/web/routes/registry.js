import express from "express";
import * as registryController from "../controllers/registryController.js";
import requireRole from "../middleware/requireRole.js";

const router = express.Router();

// Every registry route requires the registry services officer role.
router.use(requireRole("registry services officer"));

router.get("/", registryController.getRegistry);

router.get("/officers/add", registryController.getAddOfficer);
router.post("/officers/add", registryController.postAddOfficer);
router.get("/officers/:id/edit", registryController.getEditOfficer);
router.post("/officers/:id/edit", registryController.postEditOfficer);
router.post("/officers/:id/delete", registryController.deleteOfficer);

router.get("/degrees/add", registryController.getAddDegree);
router.post("/degrees/add", registryController.postAddDegree);
router.get("/degrees/:id/edit", registryController.getEditDegree);
router.post("/degrees/:id/edit", registryController.postEditDegree);
router.post("/degrees/:id/delete", registryController.deleteDegree);

export default router;
