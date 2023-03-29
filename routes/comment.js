import express from "express";
import allowCurrent from "../middlewares/allowCurrent";
import CommentController from "../controllers/CommentController";

const router = express.Router();

router.get('/available', CommentController.getComments);

router.post('/available', CommentController.addComment);

router.get('/', allowCurrent('getCommentsForAdmin'), CommentController.getCommentsForAdmin);

router.get('/:id', allowCurrent('getSingleComment'), CommentController.getSingleComment);

router.put('/:id', allowCurrent('updateComment'), CommentController.updateComment);

export default router;
