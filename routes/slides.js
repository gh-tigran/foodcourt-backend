import express from "express";
import SlidesController from "../controllers/SlidesController";
import uploader from "../middlewares/fileUploader";

const router = express.Router();

router.get('/', SlidesController.getSlides);
router.get('/:id', SlidesController.getSingleSlide);
router.delete('/:id', SlidesController.deleteSlide);
router.post('/', uploader.single("image"), SlidesController.createSlide);
router.put('/', uploader.single("image"), SlidesController.updateSlide);

export default router;