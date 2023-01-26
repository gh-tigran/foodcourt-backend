import express from "express";
import uploader from "../middlewares/fileUploader";
import NewsController from "../controllers/NewsController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.get('/get/', NewsController.getNews);

router.get('/get/:slugName', NewsController.getSingleNews);

router.delete('/:id', allowCurrent('createNews'), NewsController.deleteNews);

router.put('/:id', allowCurrent('updateNews'), uploader.single("image"), NewsController.updateNews);

router.post('/', allowCurrent('deleteNews'), uploader.single("image"), NewsController.createNews);
export default router;
