import express from "express";
import slides from "./slides";
import offers from "./offers";
import categories from "./categories";
import products from "./products";
import branches from "./branches";
import users from "./users";
import admin from "./admin";
import basket from "./basket";
import orders from "./orders";
import paymentTypes from "./paymentTypes";
import footer from "./footer";
import comment from "./comment";
import about from "./about";

const router = express.Router();

router.use('/admin', admin);
router.use('/users', users);
router.use('/basket', basket);
router.use('/slides', slides);
router.use('/offers', offers);
router.use('/categories', categories);
router.use('/products', products);
router.use('/map', branches);
router.use('/orders', orders);
router.use('/payment-types', paymentTypes);
router.use('/footer', footer);
router.use('/comment', comment);
router.use('/about', about);

export default router;
