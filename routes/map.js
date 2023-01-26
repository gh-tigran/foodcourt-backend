import express from "express";
import uploader from "../middlewares/fileUploader";
import MapController from "../controllers/MapController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();

router.get('/get/', MapController.getBranches);

router.get('/get/:id', MapController.getSingleBranch);

router.delete('/:id', allowCurrent('deleteBranch'), MapController.deleteBranch);

router.put('/:id', allowCurrent('updateBranch'), uploader.array("images[]"), MapController.updateBranch);

router.post('/', allowCurrent('createBranch'), uploader.array("images[]"), MapController.createBranch);

export default router;
