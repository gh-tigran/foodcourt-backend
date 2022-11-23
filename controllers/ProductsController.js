import {Categories, Products} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";

export default class ProductsController {
    static getProducts = async (req, res, next) => {
        try {
            let {order = 0, page = 1, limit = 2} = req.query;
            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            const count = await Products.count();
            const totalPages = Math.ceil(count / limit);
            const orderTypes = Products.getOrderTypes();

            const products = await Products.findAll({
                where: {},
                include: [{
                    model: Categories,
                    as: 'category',
                    required: true,
                }],
                order: [
                    [
                        orderTypes[order].orderBy,
                        orderTypes[order].type]
                    ,
                ],
                offset,
                limit
            });

            res.json({
                status: "ok",
                products: !_.isEmpty(products) ? {
                    products,
                    orderTypes,
                    totalPages
                } : {},
            });
        } catch (e) {
            next(e);
        }
    }

    static getProductsByCategory = async (req, res, next) => {
        try {
            const {categoryId} = req.params;
            let {order = 0, page = 1, limit = 2} = req.query;
            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            const count = await Products.count();
            const totalPages = Math.ceil(count / limit);
            const orderTypes = Products.getOrderTypes();

            const validate = Joi.object({
                categoryId: Joi.number().min(1).required(),
            }).validate({categoryId});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const products = await Products.findAll({
                where: {categoryId},
                include: [{
                    model: Categories,
                    as: 'category',
                    required: true,
                }],
                order: [
                    [
                        orderTypes[order].orderBy,
                        orderTypes[order].type
                    ],
                ],
                offset,
                limit
            });

            res.json({
                status: "ok",
                products: !_.isEmpty(products) ? {
                    products,
                    orderTypes,
                    totalPages
                } : {},
            });
        } catch (e) {
            next(e);
        }

    };

    static getSingleProduct = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const product = await Products.findOne({
                where: {id},
                include: [{
                    model: Categories,
                    as: 'category',
                    required: true,
                }]
            });

            res.json({
                status: "ok",
                product: product || {},
            });
        } catch (e) {
            next(e);
        }
    };

    static createProduct = async (req, res, next) => {
        try {
            const {file} = req;
            const {title, description, price, categoryId} = req.body;

            const validate = Joi.object({
                title: Joi.string().min(2).max(75).required(),
                description: Joi.string().min(2).max(200).required(),
                price: Joi.number().min(10).max(50000).required(),
                categoryId: Joi.number().min(0).required(),
            }).validate({title, description, price, categoryId});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const category = await Categories.findOne({where: {id: categoryId}});

            if (_.isEmpty(category)) {
                throw HttpError(403, "Category from that id doesn't exist");
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Products.getImgPath(filePath));

            const createdProduct = await Products.create({
                imagePath: filePath,
                title,
                description,
                price,
                categoryId,
            });

            res.json({
                status: "ok",
                createdProduct
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static updateProduct = async (req, res, next) => {
        try {
            const {file} = req;
            const {id, title, description, price, categoryId} = req.body;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
                title: Joi.string().min(2).max(75).required(),
                description: Joi.string().min(2).max(200).required(),
                price: Joi.number().min(10).max(50000).required(),
                categoryId: Joi.number().min(0).required(),
            }).validate({id, title, description, price, categoryId});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const category = await Categories.findOne({where: {id: categoryId}});

            if (_.isEmpty(category)) {
                throw HttpError(403, "Category from that id doesn't exist");
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Products.getImgPath(filePath));

            const updatingProduct = await Products.findOne({where: {id}});

            if (_.isEmpty(updatingProduct)) {
                throw HttpError(404, "Not found product from that id");
            }

            const updateImgPath = Products.getImgPath(updatingProduct.imagePath);

            if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath)

            const updatedProduct = await Products.update({
                imagePath: filePath,
                title,
                description,
                price,
                categoryId
            }, {where: {id},});

            res.json({
                status: "ok",
                updatedProduct
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static deleteProduct = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingProduct = await Products.findOne({where: {id}});

            if (_.isEmpty(deletingProduct)) {
                throw HttpError(404, "Not found product from that id");
            }

            const delImgPath = Products.getImgPath(deletingProduct.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            const deletedProduct = await Products.destroy({where: {id}});

            res.json({
                status: "ok",
                deletedProduct
            });
        } catch (e) {
            next(e);
        }
    };
}
