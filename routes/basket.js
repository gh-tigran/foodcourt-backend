import express from "express";
import BasketController from "../controllers/BasketController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.get('/', allowCurrent('getBasket'), BasketController.getBasket);

router.post('/', allowCurrent('addToBasket'), BasketController.addToBasket);

router.put('/', allowCurrent('updateBasketItem'), BasketController.updateBasketItem);

router.delete('/', allowCurrent('removeFromBasket'), BasketController.removeFromBasket);
export default router;
