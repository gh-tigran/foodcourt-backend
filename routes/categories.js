import express from "express";
import uploader from "../middlewares/fileUploader";
import CategoriesController from "../controllers/CategoriesController";










const router = express.Router();

router.get('/', CategoriesController.getCategories);
router.get('/:id', CategoriesController.getSingleCategory);
router.delete('/:id', CategoriesController.deleteCategory);
router.post('/', uploader.single("image"), CategoriesController.createCategory);
router.put('/', uploader.single("image"), CategoriesController.updateCategory);

export default router;
