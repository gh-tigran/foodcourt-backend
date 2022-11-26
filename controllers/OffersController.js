import {Offers} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from 'joi';

export default class OffersController {
    static getOffers = async (req, res, next) => {
        try {
            let {page = 1, limit = 3} = req.query;
            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;

            const offers = await Offers.findAll({
                where: {},
                offset,
                limit
            });

            res.json({
                status: "ok",
                offers: offers || [],
            });
        } catch (e) {
            next(e);
        }
    }

    static getSingleOffer = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const offer = await Offers.findOne({where: {id}});

            res.json({
                status: "ok",
                offer: offer || {},
            });
        } catch (e) {
            next(e);
        }
    };

    static createOffer = async (req, res, next) => {
        try {
            const {file} = req;
            const {title, description, price} = req.body;

            const validate = Joi.object({
                title: Joi.string().min(2).max(75).required(),
                description: Joi.string().min(2).max(200).required(),
                price: Joi.number().min(10).max(50000).required(),
            }).validate({title, description, price});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Offers.getImgPath(filePath));

            const createdOffer = await Offers.create({
                imagePath: filePath,
                title,
                description,
                price,
            });

            res.json({
                status: "ok",
                createdOffer
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static updateOffer = async (req, res, next) => {
        try {
            const {file} = req;
            const {id} = req.params;
            const {title, description, price} = req.body;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
                title: Joi.string().min(2).max(75).required(),
                description: Joi.string().min(2).max(200).required(),
                price: Joi.number().min(10).max(50000).required(),
            }).validate({id, title, description, price});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Offers.getImgPath(filePath));

            const updatingOffer = await Offers.findOne({where: {id}});

            if (_.isEmpty(updatingOffer)) {
                throw HttpError(404, "Not found offer from that id");
            }

            const updateImgPath = Offers.getImgPath(updatingOffer.imagePath);

            if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath);

            const updatedOffer = await Offers.update({
                imagePath: filePath,
                title,
                description,
                price,
            }, {where: {id},});

            res.json({
                status: "ok",
                updatedOffer
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static deleteOffer = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingOffer = await Offers.findOne({where: {id}});

            if(_.isEmpty(deletingOffer)){
                throw HttpError(404, "Not found product from that id");
            }

            const delImgPath = Offers.getImgPath(deletingOffer.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            const deletedOffer = await Offers.destroy({where: {id}});

            res.json({
                status: "ok",
                deletedOffer
            });
        } catch (e) {
            next(e);
        }
    };
}
