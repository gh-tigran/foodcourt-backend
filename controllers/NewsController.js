import {News} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";

export default class NewsController {
    static getNews = async (req, res, next) => {
        try {
            let {page = 1, limit = 2} = req.query;
            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            const count = await News.count();
            const totalPages = Math.ceil(count / limit);

            const news = await News.findAll({
                where: {},
                offset,
                limit
            });

            res.json({
                status: "ok",
                news: !_.isEmpty(news) ? {
                    news,
                    totalPages
                } : {},
            });
        } catch (e) {
            next(e);
        }
    }

    static getSingleNews = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const singleNews = await News.findOne({where: {id}});

            res.json({
                status: "ok",
                singleNews: singleNews || {},
            });
        } catch (e) {
            next(e);
        }
    };

    static createNews = async (req, res, next) => {
        try {
            const {file} = req;
            const {title, description} = req.body;

            const validate = Joi.object({
                title: Joi.string().min(2).max(75).required(),
                description: Joi.string().min(2).required()
            }).validate({title, description});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, News.getImgPath(filePath));

            const createdNews = await News.create({
                imagePath: filePath,
                title,
                description,
            });

            res.json({
                status: "ok",
                createdNews
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static updateNews = async (req, res, next) => {
        try {
            const {file} = req;
            const {id, title, description} = req.body;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
                title: Joi.string().min(2).max(75).required(),
                description: Joi.string().min(2).required(),
            }).validate({id, title, description});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);

            fs.renameSync(file.path, News.getImgPath(filePath));

            const updatingNews = await News.findOne({where: {id}});

            if (_.isEmpty(updatingNews)) {
                throw HttpError(404, "Not found product from that id");
            }

            const updateImgPath = News.getImgPath(updatingNews.imagePath);

            if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath)

            const updatedNews = await News.update({
                imagePath: filePath,
                title,
                description,
            }, {where: {id},});

            res.json({
                status: "ok",
                updatedNews
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static deleteNews = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingNews = await News.findOne({where: {id}});

            if (_.isEmpty(deletingNews)) {
                throw HttpError(404, "Not found product from that id");
            }

            const delImgPath = News.getImgPath(deletingNews.imagePath);

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            const deletedNews = await News.destroy({where: {id}});

            res.json({
                status: "ok",
                deletedNews
            });
        } catch (e) {
            next(e);
        }
    };
}
