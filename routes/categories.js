import express from "express";
import uploader from "../middlewares/fileUploader";
import CategoriesController from "../controllers/CategoriesController";

const router = express.Router();

router.get('/', CategoriesController.getCategories);
router.get('/:id', CategoriesController.getSingleCategory);
router.delete('/:id', CategoriesController.deleteCategory);
router.put('/:id', uploader.single("image"), CategoriesController.updateCategory);
router.post('/', uploader.single("image"), CategoriesController.createCategory);

export default router;
