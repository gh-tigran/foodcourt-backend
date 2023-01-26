import express from "express";
import uploader from "../middlewares/fileUploader";
import OffersController from "../controllers/OffersController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.get('/get/', OffersController.getOffers);

router.get('/get/:slugName', OffersController.getSingleOffer);

router.delete('/:id', allowCurrent('deleteOffer'), OffersController.deleteOffer);

router.put('/:id', allowCurrent('updateOffer'), uploader.single("image"), OffersController.updateOffer);

router.post('/', allowCurrent('createOffer'), uploader.single("image"), OffersController.createOffer);
export default router;
