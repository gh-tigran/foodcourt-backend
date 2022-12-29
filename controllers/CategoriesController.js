import {Categories, Products} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";

export default class CategoriesController {
    static getCategories = async (req, res, next) => {
        try {
            const {name} = req.query;
            const where = name ? {name: { $like: `%${name}%` }} : {};

            const categories = await Categories.findAll({where});

            res.json({
                status: "ok",
                categories: categories || [],
            });
        } catch (e) {
            next(e);
        }
    }

    static getSingleCategory = async (req, res, next) => {
        try {
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const category = await Categories.findOne({where: {slugName}});

            res.json({
                status: "ok",
                category: category || {},
            });
        } catch (e) {
            next(e);
        }
    };

    static createCategory = async (req, res, next) => {
        try {
            const {file} = req;
            const {name} = req.body;

            const validate = Joi.object({
                name: Joi.string().min(4).max(80).required(),
            }).validate({name});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if (_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)) {
                throw HttpError(403, "Doesn't sent Image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);
            const slugName = await Categories.generateSlug(name);

            fs.renameSync(file.path, Categories.getImgPath(filePath));

            const createdCategory = await Categories.create({
                imagePath: filePath,
                slugName,
                name,
            });

            res.json({
                status: "ok",
                createdCategory
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static updateCategory = async (req, res, next) => {
        try {
            const {file} = req;
            const {slugName} = req.params;
            const {name} = req.body;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
                name: Joi.string().min(2).max(80),
            }).validate({slugName, name});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatingCategory = await Categories.findOne({where: {slugName}});
            let updateImgPath = Categories.getImgPath(updatingCategory.imagePath);
            let slugNameUpdate = '';
            let products = [];
            let imagePath;

            if (_.isEmpty(updatingCategory)) {
                throw HttpError(404, "Not found category from that slug");
            }

            if (!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)) {
                imagePath = path.join('files', uuidV4() + '-' + file.originalname);

                if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath);
                fs.renameSync(file.path, Categories.getImgPath(imagePath));
            }

            if(name && name !== updatingCategory.name){
                slugNameUpdate = await Categories.generateSlug(name);

                products = await Products.findAll({
                    where: {categorySlug: slugName},
                });
            }

            const updatedCategory = await Categories.update({
                slugName: slugNameUpdate || slugName,
                imagePath,
                name,
            }, {where: {slugName},});

            products.forEach(product => {
                (async () => {
                    await Products.update({
                        imagePath: product.imagePath,
                        slugName: product.slugName,
                        categoryId: product.categoryId,
                        title: product.title,
                        description: product.description,
                        price: product.price,
                        categorySlug: slugNameUpdate,
                    }, {where: {id: product.id},});
                })()
            });

            res.json({
                status: "ok",
                updatedCategory
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static deleteCategory = async (req, res, next) => {
        try {
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingCategory = await Categories.findOne({where: {slugName}});

            if (_.isEmpty(deletingCategory)) {
                throw HttpError(404, "Not found category from that slug");
            }

            const delImgPath = Categories.getImgPath(deletingCategory.imagePath);
            const products = await Products.findAll({
                where: {categorySlug: slugName},
            });

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath);

            const deletedCategory = await Categories.destroy({where: {slugName}});

            products.forEach(product => {
                const delProdImgPath = Products.getImgPath(product.imagePath);

                if (fs.existsSync(delProdImgPath)) fs.unlinkSync(delProdImgPath);
            });

            res.json({
                status: "ok",
                deletedCategory
            });
        } catch (e) {
            next(e);
        }
    }

    // static updateCategory = async (req, res, next) => {
    //     try {
    //         const {file} = req;
    //         const {slugName} = req.params;
    //         const {name} = req.body;
    //
    //         const validate = Joi.object({
    //             slugName: Joi.string().min(2).max(80).required(),
    //             name: Joi.string().min(2).max(80).required(),
    //         }).validate({slugName, name});
    //
    //         if (validate.error) {
    //             throw HttpError(403, validate.error);
    //         }
    //
    //         if (_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)) {
    //             throw HttpError(403, "Image doesn't sent!");
    //         }
    //
    //         const updatingCategory = await Categories.findOne({where: {slugName}});
    //
    //         if (_.isEmpty(updatingCategory)) {
    //             throw HttpError(404, "Not found category from that slug");
    //         }
    //
    //         const filePath = path.join('files', uuidV4() + '-' + file.originalname);
    //         const updateImgPath = Categories.getImgPath(updatingCategory.imagePath);
    //         const slugNameUpdate = await Categories.generateSlug(name);
    //
    //         if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath);
    //
    //         fs.renameSync(file.path, Categories.getImgPath(filePath));
    //
    //         const updatedCategory = await Categories.update({
    //             imagePath: filePath,
    //             slugName: slugNameUpdate,
    //             name,
    //         }, {where: {slugName},});
    //
    //         const products = await Products.findAll({
    //             where: {categorySlug: slugName},
    //         });
    //
    //         products.forEach(product => {
    //             (async () => {
    //                 await Products.update({
    //                     imagePath: product.imagePath,
    //                     slugName: product.slugName,
    //                     categoryId: product.categoryId,
    //                     title: product.title,
    //                     description: product.description,
    //                     price: product.price,
    //                     categorySlug: slugNameUpdate,
    //                 }, {where: {id: product.id},});
    //             })()
    //         });
    //
    //         res.json({
    //             status: "ok",
    //             updatedCategory
    //         })
    //     } catch (e) {
    //         if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
    //             fs.unlinkSync(req.file.path);
    //         }
    //         next(e);
    //     }
    // }
}
