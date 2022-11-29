import express from "express";
import uploader from "../middlewares/fileUploader";
import OffersController from "../controllers/OffersController";

const router = express.Router();

router.get('/', OffersController.getOffers);
router.get('/:slugName', OffersController.getSingleOffer);
router.delete('/:slugName', OffersController.deleteOffer);
router.put('/:slugName', uploader.single("image"), OffersController.updateOffer);
router.post('/', uploader.single("image"), OffersController.createOffer);


export default router;
