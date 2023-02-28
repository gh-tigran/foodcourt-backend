import express from "express";
import PaymentTypesController from "../controllers/PaymentTypesController";

const router = express.Router();

router.get('/', PaymentTypesController.getPaymentTypes);

router.get('/:id', PaymentTypesController.getSinglePaymentTypes);

router.post('/', PaymentTypesController.addPaymentType);

router.put('/:id', PaymentTypesController.updatePaymentType);

router.delete('/:id', PaymentTypesController.deletePaymentType);

export default router;
