import express from "express";
import UserController from "../controllers/UserController";
import allowCurrent from "../middlewares/allowCurrent";
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();
router.post('/register', limiter, UserController.register);

router.post('/login', limiter, UserController.login);

router.get('/confirm', UserController.confirm);

router.post('/forget-pass', UserController.forgetPassword);

router.post('/change-pass', UserController.changePassword);

router.get('/current', allowCurrent('userCurrent'), UserController.current);

router.put('/current', allowCurrent('userModifyCurrent'), UserController.modifyCurrentAccount);

router.delete('/current', allowCurrent('userDeleteCurrent'), UserController.deleteCurrentAccount);

router.get('/', allowCurrent('usersList'), UserController.list);

router.get('/:id', allowCurrent('userSingle'), UserController.single);

router.post('/:id', allowCurrent('userChangeStatus'), UserController.changeAccountStatus);
export default router;
