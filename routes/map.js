import express from "express";
import uploader from "../middlewares/fileUploader";
import MapController from "../controllers/MapController";

const router = express.Router();

router.get('/', MapController.getBranches);
router.get('/:slugName', MapController.getSingleBranch);
router.delete('/:slugName', MapController.deleteBranch);
router.put('/:slugName', uploader.array("images[]"), MapController.updateBranch);
router.post('/', uploader.array("images[]"), MapController.createBranch);

export default router;
