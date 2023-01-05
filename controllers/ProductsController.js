import {Categories, ProdCatRel, Products} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";

export default class ProductsController {
    static getProducts = async (req, res, next) => {
        try {
            let {order = 0, page = 1, limit = 10, title = ''} = req.query;

            const validate = Joi.object({
                order: Joi.number().valid(0, 1, 2, 3),
                page: Joi.number().min(0),
                limit: Joi.number().min(0).max(30),
                title: Joi.string().min(0),
            }).validate({order, page, limit, title});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            const orderTypes = Products.getOrderTypes();
            const where = title ? {title: {$like: `%${title}%`}} : {};
            const include = [{
                model: Categories,
                as: 'categories',
            }];

            const count = await Products.findAll({
                where,
                include,
                attributes: [],
            });
            const totalPages = Math.ceil(count.length / limit);

            const products = await Products.findAll({
                where,
                include,
                order: [
                    [
                        orderTypes[order].orderBy,
                        orderTypes[order].type],
                ],
                offset,
                limit
            });

            res.json({
                status: "ok",
                data: !_.isEmpty(products) ? {
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
            let {order = 0, page = 1, limit = 10, title = ''} = req.query;
            const {categorySlug} = req.params;

            const validate = Joi.object({
                order: Joi.number().valid(0, 1, 2, 3),
                page: Joi.number().min(0),
                limit: Joi.number().min(0).max(30),
                title: Joi.string().min(0),
                categorySlug: Joi.string().min(2).max(80).required(),
            }).validate({order, page, limit, title, categorySlug});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            const where = title ? {title: {$like: `%${title}%`}} : {};
            const include = [{
                model: Categories,
                as: 'categories',
                required: true,
                where: {
                    slugName: categorySlug
                }
            }];
            const count = await Products.findAll({where, include, attributes: []});
            const totalPages = Math.ceil(count.length / limit);
            const orderTypes = Products.getOrderTypes();

            const products = await Products.findAll({
                where,
                include,
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
                data: !_.isEmpty(products) ? {
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
                    as: 'categories',
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

            const createdProduct = await Products.create({
                imagePath: filePath,
                title,
                description,
                price,
                slugName,
                type: 'product'
            });

            categoryId.forEach(id => {
                (async () => {
                    const cat = await Categories.findOne({where: {id}});

                    if (!_.isEmpty(cat)) {
                        await ProdCatRel.create({
                            productId: createdProduct.id,
                            categoryId: cat.id,
                        });
                    }
                })()
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

            const updatingProduct = await Products.findOne({where: {slugName}});
            let slugNameUpdate = '';
            let filePath = '';

            if (_.isEmpty(updatingProduct)) {
                throw HttpError(404, "Not found product from that slagName");
            }

            if (!_.isEmpty(categoryId)) {
                await ProdCatRel.destroy({where: {productId: updatingProduct.id}});

                categoryId.forEach(id => {
                    (async () => {
                        await ProdCatRel.create({
                            productId: updatingProduct.id,
                            categoryId: id
                        })
                    })()
                })
            }

            if (title && title !== updatingProduct.title) {
                slugNameUpdate = await Products.generateSlug(title);

                if(slugNameUpdate === '-'){
                    throw HttpError(403, 'Invalid title');
                }
            }

            if (!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)) {
                filePath = path.join('files', uuidV4() + '-' + file.originalname);

                fs.renameSync(file.path, Products.getImgPath(filePath));

                const updateImgPath = Products.getImgPath(updatingProduct.imagePath);

                if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath)
            }

            const updatedProduct = await Products.update({
                imagePath: filePath || updatingProduct.imagePath,
                slugName: slugNameUpdate || slugName,
                title,
                description,
                price,
            }, {where: {slugName}});

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
                throw HttpError(404, "Not found product from that slug name");
            }

            const delImgPath = Products.getImgPath(deletingProduct.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            await ProdCatRel.destroy({where: {productId: deletingProduct.id}});

            const deletedProduct = await Products.destroy({where: {slugName}});

            res.json({
                status: "ok",
                deletedProduct
            });
        } catch (e) {
            next(e);
        }
    };
}
