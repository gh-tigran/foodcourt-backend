import express from "express";
import uploader from "../middlewares/fileUploader";
import MapController from "../controllers/MapController";

const router = express.Router();

router.get('/', MapController.getBranches);
router.get('/:id', MapController.getSingleBranch);
router.delete('/:id', MapController.deleteBranch);
router.put('/:id', uploader.array("images[]"), MapController.updateBranch);
router.post('/', uploader.array("images[]"), MapController.createBranch);

export default router;
