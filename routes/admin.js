import express from "express";
import AdminController from "../controllers/AdminController";

const router = express.Router();
router.post('/register', AdminController.register);

router.post('/login', AdminController.login);

router.get('/confirm', AdminController.confirm);

router.get('/admin', AdminController.admin);

router.get('/', AdminController.list);

router.get('/:id', AdminController.single);

router.put('/:id', AdminController.modifyAccount);

router.delete('/:id', AdminController.deleteAccount);

router.post('/forget-pass', AdminController.forgetPassword);

router.post('/change-pass', AdminController.changePassword);

export default router;
