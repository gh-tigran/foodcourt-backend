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
            const {title} = req.query;
            const where = title ? {title: { $like: `%${title}%` }} : {};

            const offers = await Offers.findAll({where});

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
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const offer = await Offers.findOne({where: {slugName}});

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
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const validate = Joi.object({
                title: Joi.string().min(2).max(80).required(),
                description: Joi.string().min(2).max(3000).required(),
                price: Joi.number().min(10).max(50000).required(),
            }).validate({title, description, price});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);
            const slugName = await Offers.generateSlug(title);

            fs.renameSync(file.path, Offers.getImgPath(filePath));

            const createdOffer = await Offers.create({
                imagePath: filePath,
                slugName,
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
            const {slugName} = req.params;
            const {title, description, price} = req.body;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
                title: Joi.string().min(2).max(80),
                description: Joi.string().min(2).max(3000),
                price: Joi.number().min(10).max(50000),
            }).validate({slugName, title, description, price});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatingOffer = await Offers.findOne({where: {slugName}});
            let slugNameUpdate = '';
            let filePath = '';

            if (_.isEmpty(updatingOffer)) {
                throw HttpError(404, "Not found offer from that slugName");
            }

            if(title && title !== updatingOffer.title){
                slugNameUpdate = await Offers.generateSlug(title);
            }

            if(!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)){
                const updateImgPath = Offers.getImgPath(updatingOffer.imagePath);
                filePath = path.join('files', uuidV4() + '-' + file.originalname);

                fs.renameSync(file.path, Offers.getImgPath(filePath));

                if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath);
            }

            const updatedOffer = await Offers.update({
                imagePath: filePath || updatingOffer.imagePath,
                slugName: slugNameUpdate || slugName,
                title,
                description,
                price,
            }, {where: {slugName}});

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
            const {slugName} = req.params;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingOffer = await Offers.findOne({where: {slugName}});

            if(_.isEmpty(deletingOffer)){
                throw HttpError(404, "Not found product from that slugName");
            }

            const delImgPath = Offers.getImgPath(deletingOffer.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            const deletedOffer = await Offers.destroy({where: {slugName}});

            res.json({
                status: "ok",
                deletedOffer
            });
        } catch (e) {
            next(e);
        }
    };

    // static updateOffer = async (req, res, next) => {
    //     try {
    //         const {file} = req;
    //         const {slugName} = req.params;
    //         const {title, description, price} = req.body;
    //
    //         const validate = Joi.object({
    //             slugName: Joi.string().min(2).max(80).required(),
    //             title: Joi.string().min(2).max(80).required(),
    //             description: Joi.string().min(2).max(3000).required(),
    //             price: Joi.number().min(10).max(50000).required(),
    //         }).validate({slugName, title, description, price});
    //
    //         if (validate.error) {
    //             throw HttpError(403, validate.error);
    //         }
    //
    //         if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
    //             throw HttpError(403, "Doesn't sent image!");
    //         }
    //
    //         const updatingOffer = await Offers.findOne({where: {slugName}});
    //
    //         if (_.isEmpty(updatingOffer)) {
    //             throw HttpError(404, "Not found offer from that slugName");
    //         }
    //
    //         const updateImgPath = Offers.getImgPath(updatingOffer.imagePath);
    //         const filePath = path.join('files', uuidV4() + '-' + file.originalname);
    //
    //         fs.renameSync(file.path, Offers.getImgPath(filePath));
    //
    //         if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath);
    //
    //         const slugNameUpdate = await Offers.generateSlug(title);
    //
    //         const updatedOffer = await Offers.update({
    //             imagePath: filePath,
    //             slugName: slugNameUpdate,
    //             title,
    //             description,
    //             price,
    //         }, {where: {slugName}});
    //
    //         res.json({
    //             status: "ok",
    //             updatedOffer
    //         })
    //     } catch (e) {
    //         if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
    //             fs.unlinkSync(req.file.path);
    //         }
    //         next(e);
    //     }
    // }
}
