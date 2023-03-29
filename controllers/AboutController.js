import {About} from "../models";
import _ from "lodash";
import HttpError from "http-errors";
import Joi from "joi";
import Validator from "../middlewares/Validator";
import {joiErrorMessage} from "../services/JoiConfig";

export default class AboutController{
    static getAbout = async (req, res, next) => {
        try {
            const about = await About.findOne();

            res.json({
                status: "ok",
                about: about || {},
            });
        } catch (e) {
            next(e);
        }
    }

    static createAbout = async (req, res, next) => {
        try {
            const {title, description} = req.body;

            const oldAbout = About.findOne();

            if(!_.isEmpty(oldAbout)){
                throw HttpError(422, "'About' уже существует");
            }

            const validate = Joi.object({
                title: Validator.longText(true).error(new Error(joiErrorMessage.title)),
                description: Validator.longText(true).error(new Error(joiErrorMessage.description)),
            }).validate({title, description});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const about = await About.create({
                title, description
            });

            res.json({
                status: "ok",
                about
            })
        } catch (e) {
            next(e);
        }
    }

    static updateAbout = async (req, res, next) => {
        try {
            const {title, description} = req.body;
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const oldAbout = await About.findOne({where: {id}});

            if(_.isEmpty(oldAbout)){
                throw HttpError(422, "'About' не существует");
            }

            const updatedAbout = await About.update({
                title, description
            }, {where: {id},});

            res.json({
                status: "ok",
                updatedAbout
            })
        } catch (e) {
            next(e);
        }
    }
}
