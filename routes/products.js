import express from "express";
import uploader from "../middlewares/fileUploader";
import ProductsController from "../controllers/ProductsController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.get('/get/', ProductsController.getProducts);

router.get('/get/category/:categorySlug', ProductsController.getProductsByCategory);

router.get('/get/:slugName', ProductsController.getSingleProduct);

router.delete('/:id', allowCurrent('deleteProduct'), ProductsController.deleteProduct);

router.put('/:id', allowCurrent('updateProduct'), uploader.single("image"), ProductsController.updateProduct);

router.post('/', allowCurrent('createProduct'), uploader.single("image"), ProductsController.createProduct);
export default router;
