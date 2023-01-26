import express from "express";
import OrdersController from "../controllers/OrdersController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.get('/not-received', allowCurrent('ordersList'), OrdersController.getNotReceivedOrders);

router.get('/not-received/:id', allowCurrent('singleOrder'), OrdersController.getSingleNotReceivedOrder);

router.get('/user/not-received', allowCurrent('ordersListUser'), OrdersController.getNotReceivedOrders);

router.get('/', allowCurrent('ordersStatistics'), OrdersController.getOrdersStatistics);

router.post('/card', allowCurrent('orderAdd'), OrdersController.addOrderByCard);

router.put('/:id', allowCurrent('orderModify'), OrdersController.modifyOrder);

router.post('/', allowCurrent('orderAdd'), OrdersController.addOrder);
export default router;
