import express from "express";
import allowCurrent from "../middlewares/allowCurrent";
import AboutController from "../controllers/AboutController";

const router = express.Router();

router.get('/get', AboutController.getAbout);

router.post('/', allowCurrent('createAbout'), AboutController.createAbout);

router.put('/:id', allowCurrent('updateAbout'), AboutController.updateAbout);

export default router;
