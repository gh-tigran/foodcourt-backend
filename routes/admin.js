import express from "express";
import AdminController from "../controllers/AdminController";
import allowCurrent from "../middlewares/allowCurrent";
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();
router.post('/login', limiter, AdminController.login);

router.get('/confirm', AdminController.confirm);

router.post('/forget-pass', AdminController.forgetPassword);

router.post('/change-pass', AdminController.changePassword);

router.post('/register', allowCurrent('adminRegister'), AdminController.register);

router.get('/current', allowCurrent('adminGetCurrent'), AdminController.currentAdmin);

router.put('/current', allowCurrent('adminModifyCurrent'), AdminController.modifyCurrentAccount);

router.get('/:id', allowCurrent('adminSingle'), AdminController.single);

router.put('/:id', allowCurrent('adminModify'), AdminController.modifyAccount);

router.delete('/:id', allowCurrent('adminDelete'), AdminController.deleteAccount);

router.get('/', allowCurrent('adminsList'), AdminController.list);
export default router;
