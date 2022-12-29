import express from "express";
import AdminController from "../controllers/AdminController";
import allowCurrent from "../middlewares/allowCurrent";

const router = express.Router();
router.post('/register', allowCurrent('adminRegister'), AdminController.register);

router.post('/login', AdminController.login);

router.get('/confirm', AdminController.confirm);

router.get('/current', allowCurrent('adminGetCurrent'), AdminController.currentAdmin);

router.put('/current/', allowCurrent('adminModifyCurrent'), AdminController.modifyCurrentAccount);

//router.delete('/current/', allowCurrent('adminDeleteCurrent'), AdminController.deleteCurrentAccount);

router.get('/', allowCurrent('adminsList'), AdminController.list);

router.get('/:id', allowCurrent('adminSingle'), AdminController.single);

router.put('/:id', allowCurrent('adminModify'), AdminController.modifyAccount);

router.delete('/:id', allowCurrent('adminDelete'), AdminController.deleteAccount);

router.post('/forget-pass', AdminController.forgetPassword);

router.post('/change-pass', AdminController.changePassword);
export default router;
