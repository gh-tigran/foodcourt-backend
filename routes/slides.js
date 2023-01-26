import express from "express";
import SlidesController from "../controllers/SlidesController";
import uploader from "../middlewares/fileUploader";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.get('/get/', SlidesController.getSlides);

router.get('/get/:id', SlidesController.getSingleSlide);

router.delete('/:id', allowCurrent('deleteSlide'), SlidesController.deleteSlide);

router.put('/:id', allowCurrent('updateSlide'), uploader.single("image"), SlidesController.updateSlide);

router.post('/', allowCurrent('createSlide'), uploader.single("image"), SlidesController.createSlide);
export default router;
