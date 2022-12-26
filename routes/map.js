import express from "express";
import uploader from "../middlewares/fileUploader";
import MapController from "../controllers/MapController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();

router.get('/get/', MapController.getBranches);
router.get('/get/:slugName', MapController.getSingleBranch);
router.delete('/:slugName', allowCurrent('deleteBranch'), MapController.deleteBranch);
router.put('/:slugName', allowCurrent('updateBranch'), uploader.array("images[]"), MapController.updateBranch);
router.post('/', allowCurrent('createBranch'), uploader.array("images[]"), MapController.createBranch);

export default router;
