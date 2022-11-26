import express from "express";
import uploader from "../middlewares/fileUploader";
import ProductsController from "../controllers/ProductsController";

const router = express.Router();

router.get('/', ProductsController.getProducts);
router.get('/category/:categoryId', ProductsController.getProductsByCategory);
router.get('/:id', ProductsController.getSingleProduct);
router.delete('/:id', ProductsController.deleteProduct);
router.put('/:id', uploader.single("image"), ProductsController.updateProduct);
router.post('/', uploader.single("image"), ProductsController.createProduct);

export default router;
