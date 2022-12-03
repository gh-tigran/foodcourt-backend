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
                    totalPages,
                    page,
                    limit
                } : {},
            });
        } catch (e) {
            next(e);
        }
    }

    static getProductsByCategory = async (req, res, next) => {
        try {
            const {categorySlug} = req.params;
            let {order = 0, page = 1, limit = 2} = req.query;
            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            const count = await Products.count();
            const totalPages = Math.ceil(count / limit);
            const orderTypes = Products.getOrderTypes();

            const validate = Joi.object({
                categorySlug: Joi.string().min(2).max(80).required(),
            }).validate({categorySlug});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const products = await Products.findAll({
                where: {categorySlug},
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
                    totalPages,
                    page,
                    limit
                } : {},
            });
        } catch (e) {
            next(e);
        }

    };

    static getSingleProduct = async (req, res, next) => {
        try {
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const product = await Products.findOne({
                where: {slugName},
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
            const {title, description, price, categorySlug} = req.body;

            const validate = Joi.object({
                title: Joi.string().min(2).max(80).required(),
                description: Joi.string().min(2).max(3000).required(),
                price: Joi.number().min(10).max(50000).required(),
                categorySlug: Joi.string().min(2).max(80).required(),
            }).validate({title, description, price, categorySlug});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const category = await Categories.findOne({where: {slugName: categorySlug}});

            if (_.isEmpty(category)) {
                throw HttpError(403, "Category from that slug doesn't exist");
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Products.getImgPath(filePath));

            const slugName = await Products.generateSlug(title);

            const createdProduct = await Products.create({
                imagePath: filePath,
                categoryId: category.id,
                title,
                description,
                price,
                slugName,
                categorySlug,
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
            const {slugName} = req.params;
            const {title, description, price, categorySlug} = req.body;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
                title: Joi.string().min(2).max(80),
                description: Joi.string().min(2).max(3000),
                price: Joi.number().min(10).max(50000),
                categorySlug: Joi.string().min(2).max(80),
            }).validate({slugName, title, description, price, categorySlug});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatingProduct = await Products.findOne({where: {slugName}});
            let slugNameUpdate = '';
            let filePath = '';
            let category = {};

            if (_.isEmpty(updatingProduct)) {
                throw HttpError(404, "Not found product from that slagName");
            }

            if(categorySlug){
                category = await Categories.findOne({where: {slugName: categorySlug}});

                if (_.isEmpty(category)) {
                    throw HttpError(403, "Category from that slug doesn't exist");
                }
            }

            if(title && title !== updatingProduct.title){
                slugNameUpdate = await Products.generateSlug(title);
            }

            if(!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)){
                filePath = path.join('files', uuidV4() + '-' + file.originalname);

                fs.renameSync(file.path, Products.getImgPath(filePath));

                const updateImgPath = Products.getImgPath(updatingProduct.imagePath);

                if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath)
            }

            const updatedProduct = await Products.update({
                imagePath: filePath || updatingProduct.imagePath,
                slugName: slugNameUpdate || slugName,
                categoryId: category.id || updatingProduct.categoryId,
                title,
                description,
                price,
                categorySlug
            }, {where: {slugName},});

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
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingProduct = await Products.findOne({where: {slugName}});

            if (_.isEmpty(deletingProduct)) {
                throw HttpError(404, "Not found product from that id");
            }

            const delImgPath = Products.getImgPath(deletingProduct.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            const deletedProduct = await Products.destroy({where: {slugName}});

            res.json({
                status: "ok",
                deletedProduct
            });
        } catch (e) {
            next(e);
        }
    };

    // static updateProduct = async (req, res, next) => {
    //     try {
    //         const {file} = req;
    //         const {slugName} = req.params;
    //         const {title, description, price, categorySlug} = req.body;
    //
    //
    //         const validate = Joi.object({
    //             slugName: Joi.string().min(2).max(80).required(),
    //             title: Joi.string().min(2).max(80).required(),
    //             description: Joi.string().min(2).max(3000).required(),
    //             price: Joi.number().min(10).max(50000).required(),
    //             categorySlug: Joi.string().min(2).max(80).required(),
    //         }).validate({slugName, title, description, price, categorySlug});
    //
    //         if (validate.error) {
    //             throw HttpError(403, validate.error);
    //         }
    //
    //         const category = await Categories.findOne({where: {slugName: categorySlug}});
    //
    //         if (_.isEmpty(category)) {
    //             throw HttpError(403, "Category from that slug doesn't exist");
    //         }
    //
    //         if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
    //             throw HttpError(403, "Doesn't sent image!");
    //         }
    //
    //         const updatingProduct = await Products.findOne({where: {slugName}});
    //
    //         if (_.isEmpty(updatingProduct)) {
    //             throw HttpError(404, "Not found product from that slagName");
    //         }
    //
    //         const filePath = path.join('files', uuidV4() + '-' + file.originalname);
    //
    //         fs.renameSync(file.path, Products.getImgPath(filePath));
    //
    //         const updateImgPath = Products.getImgPath(updatingProduct.imagePath);
    //
    //         if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath)
    //
    //         const slugNameUpdate = await Products.generateSlug(title);
    //
    //         const updatedProduct = await Products.update({
    //             imagePath: filePath,
    //             slugName: slugNameUpdate,
    //             categoryId: category.id,
    //             title,
    //             description,
    //             price,
    //             categorySlug
    //         }, {where: {slugName},});
    //
    //         res.json({
    //             status: "ok",
    //             updatedProduct
    //         })
    //     } catch (e) {
    //         if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
    //             fs.unlinkSync(req.file.path);
    //         }
    //         next(e);
    //     }
    // }
}
