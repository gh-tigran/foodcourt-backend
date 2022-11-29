import express from "express";
import uploader from "../middlewares/fileUploader";
import ProductsController from "../controllers/ProductsController";

const router = express.Router();

router.get('/', ProductsController.getProducts);
router.get('/category/:categorySlug', ProductsController.getProductsByCategory);
router.get('/:slugName', ProductsController.getSingleProduct);
router.delete('/:slugName', ProductsController.deleteProduct);
router.put('/:slugName', uploader.single("image"), ProductsController.updateProduct);
router.post('/', uploader.single("image"), ProductsController.createProduct);

export default router;
