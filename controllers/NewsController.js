import {News} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";
import Validator from "../middlewares/Validator";

export default class NewsController {
    static getNews = async (req, res, next) => {
        try {
            let {page = 1, limit = 10, title} = req.query;

            const validate = Joi.object({
                page: Validator.numGreatOne(true),
                limit: Validator.numGreatOne(true),
                title: Validator.shortText(false),
            }).validate({page, limit, title});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            page = +page;
            limit = +limit;
            if(title) title = title.trim();
            const offset = (page - 1) * limit;
            const where = title ? {
                title: { $like: `%${title}%` }
            } : {};
            const count = await News.count({where});
            const totalPages = Math.ceil(count / limit);

            const news = await News.findAll({
                where,
                offset,
                limit
            });

            res.json({
                status: "ok",
                data: !_.isEmpty(news) ? {
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
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Validator.shortText(true),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const singleNews = await News.findOne({where: {slugName}});

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
                title: Validator.shortText(true),
                description: Validator.longText(true),
            }).validate({title, description});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const imagePath = path.join('files', uuidV4() + '-' + file.originalname);
            const slugName = await News.generateSlug(title);

            if(slugName === '-'){
                throw HttpError(403, 'Invalid title');
            }

            fs.renameSync(file.path, News.getImgPath(imagePath));

            const createdNews = await News.create({
                imagePath,
                slugName,
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
            const {id} = req.params;
            const {title, description} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
                title: Validator.shortText(true),
                description: Validator.longText(true),
            }).validate({id, title, description});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const news = await News.findOne({where: {id}});
            let slugName = news.slugName;
            let imagePath = '';

            if (_.isEmpty(news)) {
                throw HttpError(403, "Not found news from that id");
            }

            if(title && title !== news.title){
                slugName = await News.generateSlug(title);

                if(slugName === '-'){
                    throw HttpError(403, 'Invalid title');
                }
            }

            if(!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)){
                imagePath = path.join('files', uuidV4() + '-' + file.originalname);
                const updateImagePath = News.getImgPath(news.imagePath);

                fs.renameSync(file.path, News.getImgPath(imagePath));

                if (fs.existsSync(updateImagePath)) fs.unlinkSync(updateImagePath);
            }

            const updatedNews = await News.update({
                imagePath: imagePath || news.imagePath,
                slugName,
                title,
                description,
            }, {where: {id}});

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
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const news = await News.findOne({where: {id}});

            if (_.isEmpty(news)) {
                throw HttpError(403, "Not found news from that id");
            }

            const delImagePath = News.getImgPath(news.imagePath);
            const deletedNews = await News.destroy({where: {id}});

            if (fs.existsSync(delImagePath)) fs.unlinkSync(delImagePath)

            res.json({
                status: "ok",
                deletedNews
            });
        } catch (e) {
            next(e);
        }
    };
}
