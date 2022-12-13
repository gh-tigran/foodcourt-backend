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

export default router;
