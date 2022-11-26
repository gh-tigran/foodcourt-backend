import express from "express";
import uploader from "../middlewares/fileUploader";
import NewsController from "../controllers/NewsController";

const router = express.Router();

router.get('/', NewsController.getNews);
router.get('/:id', NewsController.getSingleNews);
router.delete('/:id', NewsController.deleteNews);
router.put('/:id', uploader.single("image"), NewsController.updateNews);
router.post('/', uploader.single("image"), NewsController.createNews);

export default router;
