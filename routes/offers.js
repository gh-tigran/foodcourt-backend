import express from "express";
import uploader from "../middlewares/fileUploader";
import OffersController from "../controllers/OffersController";

const router = express.Router();

router.get('/', OffersController.getOffers);
router.get('/:id', OffersController.getSingleOffer);
router.delete('/:id', OffersController.deleteOffer);
router.put('/:id', uploader.single("image"), OffersController.updateOffer);
router.post('/', uploader.single("image"), OffersController.createOffer);


export default router;
