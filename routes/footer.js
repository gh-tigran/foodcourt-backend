import express from "express";
import FooterController from "../controllers/FooterController";
import allowCurrent from "../middlewares/allowCurrent";
import uploader from "../middlewares/fileUploader";

const router = express.Router();

router.get('/get', FooterController.getFooter);

router.post('/', allowCurrent('createFooter'), FooterController.createFooter);

router.put('/:id', allowCurrent('updateFooter'), FooterController.updateFooter);

//social
router.get('/social/get', FooterController.getFooterSocial);

router.get('/social/get/:id', FooterController.getFooterSocialSingle);

router.post('/social', allowCurrent('createFooterSocial'), uploader.single("image"), FooterController.createFooterSocial);

router.put('/social/:id', allowCurrent('updateFooterSocial'), uploader.single("image"), FooterController.updateFooterSocial);

router.delete('/social/:id', allowCurrent('deleteFooterSocial'), FooterController.deleteFooterSocial);

export default router;
