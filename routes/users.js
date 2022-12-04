import express from "express";
import UserController from "../controllers/UserController";

const router = express.Router();
router.post('/register', UserController.register);

router.post('/login', UserController.login);

router.get('/confirm', UserController.confirm);

router.put('/', UserController.modifyAccount);

router.delete('/', UserController.deleteAccount);

router.get('/', UserController.list);

router.get('/:id', UserController.single);
export default router;
