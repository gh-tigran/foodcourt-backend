import express from "express";
import AdminController from "../controllers/AdminController";

const router = express.Router();
router.post('/register', AdminController.register);

router.post('/login', AdminController.login);

router.get('/confirm', AdminController.confirm);

router.put('/:id', AdminController.modifyAccount);

router.delete('/:id', AdminController.deleteAccount);

router.get('/', AdminController.list);

router.get('/:id', AdminController.single);

export default router;
