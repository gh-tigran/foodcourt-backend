import express from "express";
import uploader from "../middlewares/fileUploader";
import BranchController from "../controllers/BranchController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();

router.get('/get/', BranchController.getBranches);

router.get('/get/:id', BranchController.getSingleBranch);

router.delete('/:id', allowCurrent('deleteBranch'), BranchController.deleteBranch);

router.put('/:id', allowCurrent('updateBranch'), uploader.array("images[]"), BranchController.updateBranch);

router.post('/', allowCurrent('createBranch'), uploader.array("images[]"), BranchController.createBranch);

export default router;
