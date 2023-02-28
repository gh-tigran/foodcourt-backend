import {Slides} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";
import Validator from "../middlewares/Validator";

export default class SlidesController {
    static getSlides = async (req, res, next) => {
        try {
            const slides = await Slides.findAll();

            res.json({
                status: "ok",
                slides: slides || [],
            });
        } catch (e) {
            next(e);
        }
    }

    static getSingleSlide = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const slide = await Slides.findOne({
                where: {id},
            });

            res.json({
                status: "ok",
                slide: slide || {},
            });
        } catch (e) {
            next(e);
        }
    };

    static createSlide = async (req, res, next) => {
        try {
            const {file} = req;
            const {title, description} = req.body;

            const validate = Joi.object({
                title: Validator.shortText(false),
                description: Validator.longText(false),
            }).validate({title, description});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)) {
                throw HttpError(422, "Doesn't sent image!");
            }

            const imagePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Slides.getImgPath(imagePath));

            const createdSlide = await Slides.create({
                imagePath,
                title,
                description
            });

            res.json({
                status: "ok",
                createdSlide
            });
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static updateSlide = async (req, res, next) => {
        try {
            const {file} = req;
            const {id} = req.params;
            const {title, description} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
                title: Validator.shortText(false),
                description: Validator.longText(false),
            }).validate({id, title, description});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const slide = await Slides.findOne({where: {id}});
            let imagePath = '';

            if (_.isEmpty(slide)) {
                throw HttpError(403, "Not found slide from that id!");
            }

            if (!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)) {
                imagePath = path.join('files', uuidV4() + '-' + file.originalname);
                const slideImagePath = Slides.getImgPath(slide.imagePath);

                fs.renameSync(file.path, Slides.getImgPath(imagePath));

                if (fs.existsSync(slideImagePath)) fs.unlinkSync(slideImagePath)
            }

            const updatedSlide = await Slides.update({
                imagePath: imagePath || slide.imagePath,
                title,
                description
            }, {where: {id}});

            res.json({
                status: "ok",
                updatedSlide
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static deleteSlide = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const slide = await Slides.findOne({where: {id}});

            if (_.isEmpty(slide)) {
                throw HttpError(403, "Not found slide from that id!");
            }

            const delImagePath = Slides.getImgPath(slide.imagePath);

            if (fs.existsSync(delImagePath)) fs.unlinkSync(delImagePath)

            const deletedSlide = await Slides.destroy({where: {id}});

            res.json({
                status: "ok",
                deletedSlide
            });
        } catch (e) {
            next(e);
        }
    };
}
