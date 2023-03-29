import {Footer, FooterSocial} from "../models";
import Validator from "../middlewares/Validator";
import HttpError from "http-errors";
import Joi from "joi";
import {joiErrorMessage} from '../services/JoiConfig';
import _ from "lodash";
import path from "path";
import {v4 as uuidV4} from "uuid";
import fs from "fs";

export default class FooterController {
    static getFooter = async (req, res, next) => {
        try {
            const footer = await Footer.findOne({
                include: [{
                    model: FooterSocial,
                    as: 'social',
                }]
            });

            res.json({
                status: "ok",
                footer: footer || {},
            });
        } catch (e) {
            next(e);
        }
    }

    static createFooter = async (req, res, next) => {
        try {
            const {copyright, socialMediaTitle} = req.body;

            const oldFooter = Footer.findOne();

            if(!_.isEmpty(oldFooter)){
                throw HttpError(422, "'Footer' уже существует");
            }

            const validate = Joi.object({
                copyright: Validator.longText(true).error(new Error(joiErrorMessage.copyright)),
                socialMediaTitle: Validator.longText(false).error(new Error(joiErrorMessage.socialMediaTitle)),
            }).validate({copyright, socialMediaTitle});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const createdFooter = await Footer.create({
                copyright,
                socialMediaTitle
            });

            res.json({
                status: "ok",
                createdFooter
            })
        } catch (e) {
            next(e);
        }
    }

    static updateFooter = async (req, res, next) => {
        try {
            const {copyright, socialMediaTitle} = req.body;
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const oldFooter = await Footer.findOne({where: {id}});

            if(_.isEmpty(oldFooter)){
                throw HttpError(422, "'Footer' не существует");
            }

            const updatedFooter = await Footer.update({
                copyright,
                socialMediaTitle,
            }, {where: {id},});

            res.json({
                status: "ok",
                updatedFooter
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static getFooterSocial = async (req, res, next) => {
        try {
            const social = await FooterSocial.findAll();

            res.json({
                status: "ok",
                social: social || [],
            });
        } catch (e) {
            next(e);
        }
    }

    static getFooterSocialSingle = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const social = await FooterSocial.findOne({where: {id}});

            res.json({
                status: "ok",
                social: social || {},
            });
        } catch (e) {
            next(e);
        }
    }

    static createFooterSocial = async (req, res, next) => {
        try {
            const {link} = req.body;
            const {file} = req;

            const validate = Joi.object({
                link: Validator.longText(true).error(new Error(joiErrorMessage.link)),
            }).validate({link});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (_.isEmpty(file) || !['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.mimetype)) {
                throw HttpError(422, "Изображение не отправлено");
            }

            const footer = await Footer.findOne();

            if(_.isEmpty(footer)){
                throw HttpError(422, "'Footer' не существует");
            }

            const imagePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, FooterSocial.getImgPath(imagePath));

            const createdFooterSocial = await FooterSocial.create({
                footerId: footer.id,
                imagePath,
                link
            });

            res.json({
                status: "ok",
                createdFooterSocial
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static updateFooterSocial = async (req, res, next) => {
        try {
            const {link} = req.body;
            const {file} = req;
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
                link: Validator.longText(false).error(new Error(joiErrorMessage.link)),
            }).validate({id, link});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const footerSocial = await FooterSocial.findOne({where: {id}});

            if(_.isEmpty(footerSocial)){
                throw HttpError(422, "Социальные данные нижнего колонтитула не существуют");
            }

            let updateImagePath = FooterSocial.getImgPath(footerSocial.imagePath);
            let imagePath;

            if (!_.isEmpty(file) && ['image/png', 'image/jpeg', 'image/svg+xml'].includes(file.mimetype)) {
                imagePath = path.join('files', uuidV4() + '-' + file.originalname);

                if (fs.existsSync(updateImagePath)) fs.unlinkSync(updateImagePath);
                fs.renameSync(file.path, FooterSocial.getImgPath(imagePath));
            }

            await FooterSocial.update({
                imagePath,
                link
            }, {where: {id}});

            res.json({
                status: "ok",
                updatedFooterSocialId: footerSocial.id,
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static deleteFooterSocial = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const footerSocial = await FooterSocial.findOne({where: {id}});

            if(_.isEmpty(footerSocial)){
                throw HttpError(422, "Социальные данные нижнего колонтитула не существуют");
            }

            await FooterSocial.destroy({where: {id}});

            const delImgPath = FooterSocial.getImgPath(footerSocial.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath);

            res.json({
                status: "ok",
                deletedFooterSocialId: id
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }
}
