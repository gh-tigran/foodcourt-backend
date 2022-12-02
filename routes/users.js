import express from "express";
import UserController from "../controllers/UserController";

const router = express.Router();
router.post('/register', UserController.register);

router.post('/login', UserController.login);

router.post('/modifyAccount', UserController.modifyAccount);

router.post('/deleteAccount', UserController.deleteAccount);

router.get('/list', UserController.list);

router.get('/single/:id', UserController.single);

router.get('/confirm', UserController.confirm);
export default router;
