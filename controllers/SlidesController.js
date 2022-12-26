import {Slides} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";

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
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
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

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const imagePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Slides.getImgPath(imagePath));

            const createdSlide = await Slides.create({
                imagePath: imagePath,
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

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatingSlide = await Slides.findOne({where: {id}});
            let filePath = '';

            if(_.isEmpty(updatingSlide)){
                throw HttpError(404, "Not found slide from that id!");
            }

            if(!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)){
                filePath = path.join('files', uuidV4() + '-' + file.originalname);
                const slideImgPath = Slides.getImgPath(updatingSlide.imagePath);

                fs.renameSync(file.path, Slides.getImgPath(filePath));

                if (fs.existsSync(slideImgPath)) fs.unlinkSync(slideImgPath)
            }

            const updatedSlide = await Slides.update({
                imagePath: filePath || updatingSlide.imagePath,
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
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingSlide = await Slides.findOne({where: {id}});

            if(_.isEmpty(deletingSlide)){
                throw HttpError(404, "Not found slide from that id!");
            }

            const delImgPath = Slides.getImgPath(deletingSlide.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            const deletedSlide = await Slides.destroy({where: {id}});

            res.json({
                status: "ok",
                deletedSlide
            });
        } catch (e) {
            next(e);
        }
    };

    // static updateSlide = async (req, res, next) => {
    //     try {
    //         const {file} = req;
    //         const {id} = req.params;
    //         const {src} = req.body;
    //
    //         const validate = Joi.object({
    //             id: Joi.number().min(1).required(),
    //             src: Joi.string().min(1).max(150).required(),
    //         }).validate({id, src});
    //
    //         if (validate.error) {
    //             throw HttpError(403, validate.error);
    //         }
    //
    //         if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
    //             throw HttpError(403, "Doesn't sent image!");
    //         }
    //
    //         const updatingSlide = await Slides.findOne({where: {id}});
    //
    //         if(_.isEmpty(updatingSlide)){
    //             throw HttpError(404, "Not found slide from that id!");
    //         }
    //
    //         const filePath = path.join('files', uuidV4() + '-' + file.originalname);
    //         const slideImgPath = Slides.getImgPath(updatingSlide.imagePath);
    //
    //         fs.renameSync(file.path, Slides.getImgPath(filePath));
    //
    //         if (fs.existsSync(slideImgPath)) fs.unlinkSync(slideImgPath)
    //
    //         const updatedSlide = await Slides.update({
    //             imagePath: filePath,
    //             src
    //         }, {where: {id},});
    //
    //         res.json({
    //             status: "ok",
    //             updatedSlide
    //         })
    //     } catch (e) {
    //         if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
    //             fs.unlinkSync(req.file.path);
    //         }
    //         next(e);
    //     }
    // }
}
