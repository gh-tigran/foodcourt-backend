import express from "express";
import PaymentTypesController from "../controllers/PaymentTypesController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();

router.get('/', allowCurrent('getPaymentTypes'), PaymentTypesController.getPaymentTypes);

router.get('/allowed', PaymentTypesController.getAllowedPaymentTypes);

router.get('/:id', allowCurrent('getSinglePaymentType'), PaymentTypesController.getSinglePaymentType);

router.post('/', allowCurrent('addPaymentType'), PaymentTypesController.addPaymentType);

router.put('/allow-pay', allowCurrent('allowPay'), PaymentTypesController.allowPay);

router.put('/:id', allowCurrent('updatePaymentType'), PaymentTypesController.updatePaymentType);

router.delete('/:id', allowCurrent('deletePaymentType'), PaymentTypesController.deletePaymentType);

export default router;
