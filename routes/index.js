import express from "express";
import slides from "./slides";
import offers from "./offers";
import categories from "./categories";

const router = express.Router();

router.use('/slides', slides);
router.use('/offers', offers);
router.use('/categories', categories);

export default router;
