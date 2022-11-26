import express from "express";
import SlidesController from "../controllers/SlidesController";
import uploader from "../middlewares/fileUploader";

const router = express.Router();

router.get('/', SlidesController.getSlides);
router.get('/:id', SlidesController.getSingleSlide);
router.delete('/:id', SlidesController.deleteSlide);
router.put('/:id', uploader.single("image"), SlidesController.updateSlide);
router.post('/', uploader.single("image"), SlidesController.createSlide);

export default router;
