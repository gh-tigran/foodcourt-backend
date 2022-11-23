import express from "express";
import uploader from "../middlewares/fileUploader";
import ProductsController from "../controllers/ProductsController";

const router = express.Router();

router.get('/', ProductsController.getProducts);
router.get('/category/:categoryId', ProductsController.getProductsByCategory);
router.get('/:id', ProductsController.getSingleProduct);
router.delete('/:id', ProductsController.deleteProduct);
router.post('/', uploader.single("image"), ProductsController.createProduct);
router.put('/', uploader.single("image"), ProductsController.updateProduct);

export default router;