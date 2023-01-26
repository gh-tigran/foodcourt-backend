import express from "express";
import uploader from "../middlewares/fileUploader";
import CategoriesController from "../controllers/CategoriesController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();

router.get('/get/', CategoriesController.getCategories);

router.get('/get/:slugName', CategoriesController.getSingleCategory);

router.delete('/:id', allowCurrent('deleteCategory'), CategoriesController.deleteCategory);

router.put('/:id', allowCurrent('updateCategory'), uploader.single("image"), CategoriesController.updateCategory);

router.post('/', allowCurrent('createCategory'), uploader.single("image"), CategoriesController.createCategory);

export default router;
