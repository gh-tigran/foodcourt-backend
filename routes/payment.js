import express from "express";
import PaymentController from "../controllers/PaymentController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.get('/public-key', PaymentController.getStripePublicKey);

router.post('/setup-intent', allowCurrent('paymentSetupIntent'), PaymentController.setupStripeIntent);

router.post('/create-card', allowCurrent('paymentCreateCard'), PaymentController.stripeCreateCard);

// router.post('/create-attach-card', PaymentController.stripeCreateAttachCard);

router.post('/attach', allowCurrent('paymentAttach'), PaymentController.stripeAttach);

router.post('/charge', allowCurrent('paymentCharge'), PaymentController.stripeCharge);

router.get('/card-list', allowCurrent('paymentCardList'), PaymentController.stripeCardList);

router.get('/card-single', allowCurrent('paymentCardSingle'), PaymentController.stripeCardSingle);

router.delete('/card', allowCurrent('paymentDeleteCard'), PaymentController.deleteStripeCard);

router.delete('/customer', allowCurrent('paymentDeleteCustomer'), PaymentController.deleteStripeCustomer);
export default router;
