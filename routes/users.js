import express from "express";
import UserController from "../controllers/UserController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.post('/register', UserController.register);

router.post('/login', UserController.login);

router.get('/confirm', UserController.confirm);

router.get('/current', allowCurrent('userCurrent'), UserController.current);

router.put('/current', allowCurrent('userModifyCurrent'), UserController.modifyCurrentAccount);

router.delete('/current', allowCurrent('userDeleteCurrent'), UserController.deleteCurrentAccount);

router.get('/', allowCurrent('usersList'), UserController.list);

router.get('/:id', allowCurrent('userSingle'), UserController.single);

router.delete('/:id', allowCurrent('userDelete'), UserController.deleteAccount);

router.post('/forget-pass', UserController.forgetPassword);

router.post('/change-pass', UserController.changePassword);
export default router;
