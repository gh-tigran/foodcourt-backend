import {Basket, Categories, ProdCatRel, Products} from "../models";
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
            const where = title ? {type: 'offer', title: { $like: `%${title}%` }} : {type: 'offer'};

            const offers = await Products.findAll({
                where,
                include: [{
                    model: Categories,
                    as: 'categories',
                    required: true
                }]
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
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const offer = await Products.findOne({
                where: {slugName},
                include: [{
                    model: Categories,
                    as: 'categories',
                    required: true
                }]
            });

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
            const {title, description, price, categoryId} = req.body;

            const validate = Joi.object({
                title: Joi.string().min(2).max(80).required(),
                description: Joi.string().min(2).max(3000).required(),
                price: Joi.number().min(10).max(1000000).required(),
                categoryId: Joi.array().items(Joi.number().min(1)).required(),
            }).validate({title, description, price, categoryId});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if (_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)) {
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Products.getImgPath(filePath));

            const slugName = await Products.generateSlug(title);

            if(slugName === '-'){
                throw HttpError(403, 'Invalid title');
            }

            const createdOffer = await Products.create({
                imagePath: filePath,
                title,
                description,
                price,
                slugName,
                type: 'offer'
            });

            categoryId.forEach(id => {
                (async () => {
                    const cat = await Categories.findOne({where: {id}});

                    if (!_.isEmpty(cat)) {
                        await ProdCatRel.create({
                            productId: createdOffer.id,
                            categoryId: cat.id,
                        });
                    }
                })()
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
            const {title, description, price, categoryId} = req.body;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
                title: Joi.string().min(2).max(80),
                description: Joi.string().min(2).max(3000),
                price: Joi.number().min(10).max(1000000),
                categoryId: Joi.array().items(Joi.number().min(1)),
            }).validate({slugName, title, description, price, categoryId});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatingOffer = await Products.findOne({where: {slugName}});
            let slugNameUpdate = '';
            let filePath = '';

            if (_.isEmpty(updatingOffer)) {
                throw HttpError(404, "Not found offer from that slagName");
            }

            if (!_.isEmpty(categoryId)) {
                await ProdCatRel.destroy({where: {productId: updatingOffer.id}});

                categoryId.forEach(id => {
                    (async () => {
                        await ProdCatRel.create({
                            productId: updatingOffer.id,
                            categoryId: id
                        })
                    })()
                });
            }

            if (title && title !== updatingOffer.title) {
                slugNameUpdate = await Products.generateSlug(title);

                if(slugNameUpdate === '-'){
                    throw HttpError(403, 'Invalid title');
                }
            }

            if (!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)) {
                filePath = path.join('files', uuidV4() + '-' + file.originalname);

                fs.renameSync(file.path, Products.getImgPath(filePath));

                const updateImgPath = Products.getImgPath(updatingOffer.imagePath);

                if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath)
            }

            const updatedOffer = await Products.update({
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

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingOffer = await Products.findOne({where: {slugName}});

            if (_.isEmpty(deletingOffer)) {
                throw HttpError(404, "Not found offer from that slug name");
            }

            const delImgPath = Products.getImgPath(deletingOffer.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            await ProdCatRel.destroy({where: {productId: deletingOffer.id}});

            const deletedOffer = await Products.destroy({where: {slugName}});

            res.json({
                status: "ok",
                deletedOffer
            });
        } catch (e) {
            next(e);
        }
    };
}
