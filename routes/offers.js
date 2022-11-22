import express from "express";
import uploader from "../middlewares/fileUploader";
import OffersController from "../controllers/OffersController";

const router = express.Router();

router.get('/', OffersController.getOffers);
router.get('/:id', OffersController.getSingleOffer);
router.delete('/:id', OffersController.deleteOffer);
router.post('/', uploader.single("image"), OffersController.createOffer);
router.put('/', uploader.single("image"), OffersController.updateOffer);


export default router;