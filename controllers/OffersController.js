import {Categories, ProdCatRel, Products} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from 'joi';
import Validator from "../middlewares/Validator";

export default class OffersController {
    static getOffers = async (req, res, next) => {
        try {
            const {title, category} = req.query;
            const where = title ? {
                type: 'offer',
                title: {$like: `%${title.trim()}%`}
            } : {type: 'offer'};

            const count = await Products.findAll({
                where,
                attributes: ['id'],
                include: [{
                    model: Categories,
                    as: 'categories',
                    attributes: [],
                    required: true,
                    where: category ? {id: category} : null,
                }]
            });

            const offers = await Products.findAll({
                where: {
                    $or: [
                        ...count.map(offer => {
                            return {
                                id: offer.id
                            }
                        })
                    ]
                },
                include: [{
                    model: Categories,
                    as: 'categories',
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
                slugName: Validator.shortText(true),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const offer = await Products.findOne({
                where: {slugName},
                include: [{
                    model: Categories,
                    as: 'categories',
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
                title: Validator.shortText(true),
                description: Validator.longText(true),
                price: Validator.numGreatOne(true),
                categoryId: Validator.idArray(true),
            }).validate({title, description, price, categoryId});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)) {
                throw HttpError(422, "Doesn't sent image!");
            }

            const imagePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Products.getImgPath(imagePath));

            const slugName = await Products.generateSlug(title);

            if (slugName === '-') {
                throw HttpError(403, 'Invalid title');
            }

            const createdOffer = await Products.create({
                imagePath,
                title,
                description,
                price,
                slugName,
                type: 'offer'
            });

            categoryId.forEach(id => {
                (async () => {
                    const category = await Categories.findOne({where: {id}});

                    if (!_.isEmpty(category)) {
                        await ProdCatRel.create({
                            productId: createdOffer.id,
                            categoryId: category.id,
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
            const {id} = req.params;
            const {title, description, price, categoryId} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
                title: Validator.shortText(false),
                description: Validator.longText(false),
                price: Validator.numGreatOne(false),
                categoryId: Validator.idArray(false),
            }).validate({id, title, description, price, categoryId});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const offer = await Products.findOne({where: {id}});
            let slugName = offer.slugName;
            let imagePath = '';

            if (_.isEmpty(offer)) {
                throw HttpError(403, "Not found offer from that id");
            }

            if (!_.isEmpty(categoryId)) {
                await ProdCatRel.destroy({where: {productId: offer.id}});

                categoryId.forEach(id => {
                    (async () => {
                        await ProdCatRel.create({
                            productId: offer.id,
                            categoryId: id
                        })
                    })()
                });
            }

            if (title && title !== offer.title) {
                slugName = await Products.generateSlug(title);

                if (slugName === '-') {
                    throw HttpError(403, 'Invalid title');
                }
            }

            if (!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)) {
                imagePath = path.join('files', uuidV4() + '-' + file.originalname);

                fs.renameSync(file.path, Products.getImgPath(imagePath));

                const updateImagePath = Products.getImgPath(offer.imagePath);

                if (fs.existsSync(updateImagePath)) fs.unlinkSync(updateImagePath)
            }

            const updatedOffer = await Products.update({
                imagePath: imagePath || offer.imagePath,
                slugName,
                title,
                description,
                price,
            }, {where: {id}});

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
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const offer = await Products.findOne({where: {id}});

            if (_.isEmpty(offer)) {
                throw HttpError(403, "Not found offer from that id");
            }

            const delImagePath = Products.getImgPath(offer.imagePath);

            if (fs.existsSync(delImagePath)) fs.unlinkSync(delImagePath)

            await ProdCatRel.destroy({where: {productId: id}});

            const deletedOffer = await Products.destroy({where: {id}});

            res.json({
                status: "ok",
                deletedOffer
            });
        } catch (e) {
            next(e);
        }
    };
}
