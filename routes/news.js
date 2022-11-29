import express from "express";
import uploader from "../middlewares/fileUploader";
import NewsController from "../controllers/NewsController";

const router = express.Router();

router.get('/', NewsController.getNews);
router.get('/:slugName', NewsController.getSingleNews);
router.delete('/:slugName', NewsController.deleteNews);
router.put('/:slugName', uploader.single("image"), NewsController.updateNews);
router.post('/', uploader.single("image"), NewsController.createNews);

export default router;
