import {Categories, ProdCatRel} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";
import Validator from "../middlewares/Validator";

export default class CategoriesController {
    static getCategories = async (req, res, next) => {
        try {
            const {name} = req.query;
            const where = name ? {
                name: { $like: `%${name.trim()}%` }
            } : {};

            const categories = await Categories.findAll({ where });

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
                slugName: Validator.shortText(true),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(422, validate.error);
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
            let {name} = req.body;

            const validate = Joi.object({
                name: Validator.shortText(true),
            }).validate({name});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)) {
                throw HttpError(422, "Doesn't sent Image!");
            }

            const imagePath = path.join('files', uuidV4() + '-' + file.originalname);
            const slugName = await Categories.generateSlug(name);

            if(slugName === '-'){
                throw HttpError(403, 'Invalid name.');
            }

            fs.renameSync(file.path, Categories.getImgPath(imagePath));

            const createdCategory = await Categories.create({
                imagePath,
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
            const {id} = req.params;
            let {name} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
                name: Validator.shortText(false),
            }).validate({id, name});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const category = await Categories.findOne({where: {id}});

            if (_.isEmpty(category)) {
                throw HttpError(403, "Not found category from that id.");
            }

            let updateImagePath = Categories.getImgPath(category.imagePath);
            let slugName = category.slugName;
            let imagePath;

            if (!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)) {
                imagePath = path.join('files', uuidV4() + '-' + file.originalname);

                if (fs.existsSync(updateImagePath)) fs.unlinkSync(updateImagePath);
                fs.renameSync(file.path, Categories.getImgPath(imagePath));
            }

            if(name && name !== category.name){
                slugName = await Categories.generateSlug(name);

                if(slugName === '-'){
                    throw HttpError(403, 'Invalid name.');
                }
            }

            const updatedCategory = await Categories.update({
                slugName,
                imagePath,
                name,
            }, {where: {id},});

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
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const category = await Categories.findOne({where: {id}});

            if (_.isEmpty(category)) {
                throw HttpError(403, "Not found category from that id");
            }

            const delImgPath = Categories.getImgPath(category.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath);

            await ProdCatRel.destroy({where: {categoryId: id}});

            const deletedCategory = await Categories.destroy({where: {id}});

            res.json({
                status: "ok",
                deletedCategory
            });
        } catch (e) {
            next(e);
        }
    }
}
