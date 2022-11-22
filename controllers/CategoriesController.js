import {Categories} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";

export default class CategoriesController {
    static getCategories = async (req, res, next) => {
        try {
            const categories = await Categories.findAll();

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
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const category = await Categories.findOne({where: {id}});

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
                name: Joi.string().min(2).max(75).required(),
            }).validate({name});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent Image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Categories.getImgPath(filePath));

            const createdCategory = await Categories.create({
                imagePath: filePath,
                name
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
            const {id, name} = req.body;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
                name: Joi.string().min(2).max(75).required(),
            }).validate({id, name});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Image doesn't sent!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, Categories.getImgPath(filePath));

            const updatingCategory = await Categories.findOne({where: {id}});

            if(_.isEmpty(updatingCategory)){
                throw HttpError(404, "Not found category from that id");
            }

            const updateImgPath = Categories.getImgPath(updatingCategory.imagePath);

            if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath)

            const updatedCategory = await Categories.update({
                imagePath: filePath,
                name
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
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingCategory = await Categories.findOne({where: {id}});

            if(_.isEmpty(deletingCategory)){
                throw HttpError(404, "Not found category from that id");
            }

            const updateImgPath = Categories.getImgPath(deletingCategory.imagePath);

            if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath)

            const deletedCategory = await Categories.destroy({where: {id}});

            res.json({
                status: "ok",
                deletedCategory
            });
        } catch (e) {
            next(e);
        }
    };
}
