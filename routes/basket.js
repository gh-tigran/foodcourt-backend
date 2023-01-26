import express from "express";
import BasketController from "../controllers/BasketController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.put('/:id', allowCurrent('updateBasketItem'), BasketController.updateBasketItem);

router.delete('/:id', allowCurrent('removeFromBasket'), BasketController.removeFromBasket);

router.post('/', allowCurrent('addToBasket'), BasketController.addToBasket);

router.get('/', allowCurrent('getBasket'), BasketController.getBasket);
export default router;
