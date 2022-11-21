import express from "express";
import slides from "./slides";

const router = express.Router();

router.use('/slides', slides);

export default router;
