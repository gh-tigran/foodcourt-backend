import express from "express";
import uploader from "../middlewares/fileUploader";
import CategoriesController from "../controllers/CategoriesController";

const router = express.Router();

router.get('/', CategoriesController.getCategories);
router.get('/:slugName', CategoriesController.getSingleCategory);
router.delete('/:slugName', CategoriesController.deleteCategory);
router.put('/:slugName', uploader.single("image"), CategoriesController.updateCategory);
router.post('/', uploader.single("image"), CategoriesController.createCategory);

export default router;
