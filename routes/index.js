import express from "express";
import slides from "./slides";
import offers from "./offers";
import categories from "./categories";
import products from "./products";
import news from "./news";

const router = express.Router();

router.use('/slides', slides);
router.use('/offers', offers);
router.use('/categories', categories);
router.use('/products', products);
router.use('/news', news);

export default router;
