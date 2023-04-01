import {Comment} from "../models";
import HttpError from "http-errors";
import Joi from "joi";
import Validator from "../middlewares/Validator";
import {joiErrorMessage} from "../services/JoiConfig";

export default class CommentController {
    static getComments = async (req, res, next) => {
        try {
            const comments = await Comment.findAll({
                where: { status: 'активный' }
            });

            res.json({
                status: "ok",
                comments: comments || [],
            });
        } catch (e) {
            next(e);
        }
    }

    static getCommentsForAdmin = async (req, res, next) => {
        try {
            const comments = await Comment.findAll({
                where: { status: {$not: 'удален'} }
            });

            res.json({
                status: "ok",
                comments: comments || [],
            });
        } catch (e) {
            next(e);
        }
    }

    static getSingleComment = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const comment = await Comment.findOne({where: {id, status: {$not: 'deleted'}}});

            res.json({
                status: "ok",
                comment: comment || {},
            });
        } catch (e) {
            next(e);
        }
    };

    static addComment = async (req, res, next) => {
        try {
            let {comment, name} = req.body;

            const validate = Joi.object({
                comment: Validator.longText(true).error(new Error(joiErrorMessage.comment)),
                name: Validator.shortText(true).error(new Error(joiErrorMessage.firstName)),
            }).validate({comment, name});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            await Comment.create({ comment, name, status: 'ожидающий' });

            res.json({
                status: "ok",
            })
        } catch (e) {
            next(e);
        }
    }

    static updateComment = async (req, res, next) => {
        try {
            let {status} = req.body;
            let {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
                status: Joi.string().valid('активный', 'ожидающий', 'заблокированный').required().error(new Error(joiErrorMessage.status)),
            }).validate({id,status});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            await Comment.update({
                status,
            }, {where: {id}});

            res.json({
                status: "ok",
            })
        } catch (e) {
            next(e);
        }
    }
}
