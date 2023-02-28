import express from "express";
import slides from "./slides";
import offers from "./offers";
import categories from "./categories";
import products from "./products";
import news from "./news";
import branches from "./branches";
import users from "./users";
import admin from "./admin";
import basket from "./basket";
import orders from "./orders";
import paymentTypes from "./paymentTypes";

const router = express.Router();

router.use('/admin', admin);
router.use('/users', users);
router.use('/basket', basket);
router.use('/slides', slides);
router.use('/offers', offers);
router.use('/categories', categories);
router.use('/products', products);
router.use('/news', news);
router.use('/map', branches);
router.use('/orders', orders);
router.use('/payment-types', paymentTypes);

export default router;
