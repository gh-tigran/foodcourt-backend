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
            let {page = 1, limit = 10, title = ''} = req.query;
            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            const where = title ? {title: { $like: `%${title}%` }} : {};
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
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
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
                title: Joi.string().min(2).max(80).required(),
                description: Joi.string().min(2).max(3000).required()
            }).validate({title, description});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const filePath = path.join('files', uuidV4() + '-' + file.originalname);
            const slugName = await News.generateSlug(title);

            if(slugName === '-'){
                throw HttpError(403, 'Invalid title');
            }

            fs.renameSync(file.path, News.getImgPath(filePath));

            const createdNews = await News.create({
                imagePath: filePath,
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
            const {slugName} = req.params;
            const {title, description} = req.body;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
                title: Joi.string().min(2).max(80),
                description: Joi.string().min(2).max(3000),
            }).validate({slugName, title, description});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatingNews = await News.findOne({where: {slugName}});
            let slugNameUpdate = '';
            let filePath = '';

            if (_.isEmpty(updatingNews)) {
                throw HttpError(404, "Not found product from that slugName");
            }

            if(title && title !== updatingNews.title){
                slugNameUpdate = await News.generateSlug(title);

                if(slugNameUpdate === '-'){
                    throw HttpError(403, 'Invalid title');
                }
            }

            if(!_.isEmpty(file) && ['image/png', 'image/jpeg'].includes(file.mimetype)){
                filePath = path.join('files', uuidV4() + '-' + file.originalname);
                const updateImgPath = News.getImgPath(updatingNews.imagePath);

                fs.renameSync(file.path, News.getImgPath(filePath));

                if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath);
            }

            const updatedNews = await News.update({
                imagePath: filePath || updatingNews.imagePath,
                slugName: slugNameUpdate || slugName,
                title,
                description,
            }, {where: {slugName}});

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
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingNews = await News.findOne({where: {slugName}});

            if (_.isEmpty(deletingNews)) {
                throw HttpError(404, "Not found product from that slugName");
            }

            const delImgPath = News.getImgPath(deletingNews.imagePath);
            const deletedNews = await News.destroy({where: {slugName}});

            if (fs.existsSync(delImgPath)) fs.unlinkSync(delImgPath)

            res.json({
                status: "ok",
                deletedNews
            });
        } catch (e) {
            next(e);
        }
    };

    // static updateNews = async (req, res, next) => {
    //     try {
    //         const {file} = req;
    //         const {slugName} = req.params;
    //         const {title, description} = req.body;
    //
    //         const validate = Joi.object({
    //             slugName: Joi.string().min(2).max(80).required(),
    //             title: Joi.string().min(2).max(80).required(),
    //             description: Joi.string().min(2).max(3000).required(),
    //         }).validate({slugName, title, description});
    //
    //         if (validate.error) {
    //             throw HttpError(403, validate.error);
    //         }
    //
    //         if(_.isEmpty(file) || !['image/png', 'image/jpeg'].includes(file.mimetype)){
    //             throw HttpError(403, "Doesn't sent image!");
    //         }
    //
    //         const updatingNews = await News.findOne({where: {slugName}});
    //
    //         if (_.isEmpty(updatingNews)) {
    //             throw HttpError(404, "Not found product from that slugName");
    //         }
    //
    //         const filePath = path.join('files', uuidV4() + '-' + file.originalname);
    //         const updateImgPath = News.getImgPath(updatingNews.imagePath);
    //
    //         fs.renameSync(file.path, News.getImgPath(filePath));
    //
    //         if (fs.existsSync(updateImgPath)) fs.unlinkSync(updateImgPath);
    //
    //         const slugNameUpdate = await News.generateSlug(title);
    //         const updatedNews = await News.update({
    //             imagePath: filePath,
    //             slugName: slugNameUpdate,
    //             title,
    //             description,
    //         }, {where: {slugName}});
    //
    //         res.json({
    //             status: "ok",
    //             updatedNews
    //         })
    //     } catch (e) {
    //         if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
    //             fs.unlinkSync(req.file.path);
    //         }
    //         next(e);
    //     }
    // }
}
