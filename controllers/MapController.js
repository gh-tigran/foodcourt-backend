import {Map, MapImages} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";

export default class MapController {
    static getBranches = async (req, res, next) => {
        try {
            const branches = await Map.findAll({
                include: [{
                    model: MapImages,
                    as: 'images',
                    required: true,
                }],
            });

            res.json({
                status: "ok",
                branches: branches || [],
            });
        } catch (e) {
            next(e);
        }
    }

    static getSingleBranch = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const singleBranch = await Map.findOne({
                where: {id},
                include: [{
                    model: MapImages,
                    as: 'images',
                    required: true,
                }]
            });

            res.json({
                status: "ok",
                singleBranch: singleBranch || {},
            });
        } catch (e) {
            next(e);
        }
    };

    static createBranch = async (req, res, next) => {
        try {
            const {files} = req;
            const {x, y, title, location} = req.body;
            const hasImage = files.find(file => ['image/png', 'image/jpeg'].includes(file.mimetype));

            const validate = Joi.object({
                x: Joi.number().min(0).required(),
                y: Joi.number().min(0).required(),
                title: Joi.string().min(2).max(75).required(),
                location: Joi.string().min(2).max(75).required(),
            }).validate({x, y, title, location});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(_.isEmpty(files) || _.isEmpty(hasImage)){
                throw HttpError(403, "Doesn't sent image!");
            }

            const createdBranch = await Map.create({x, y, title, location, fullCoords: `${x}${y}`});

            const filesData = files.map(file => {
                if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
                    const fileName = uuidV4() + '-' + file.originalname;
                    const filePath = path.join('files', fileName);

                    fs.renameSync(file.path, path.join(__dirname, '../public/', filePath));

                    return {
                        name: filePath,
                        size: file.size,
                        branchId: createdBranch.id,
                    }
                }
            });

            await MapImages.bulkCreate(filesData);

            res.json({
                status: "ok",
                createdBranch
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static updateBranch = async (req, res, next) => {
        try {
            const {files} = req;
            const {id} = req.params;
            const {x, y, title, location} = req.body;
            const hasImage = files.find(file => ['image/png', 'image/jpeg'].includes(file.mimetype));

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
                x: Joi.number().min(0).required(),
                y: Joi.number().min(0).required(),
                title: Joi.string().min(2).max(75).required(),
                location: Joi.string().min(2).max(75).required(),
            }).validate({id, x, y, title, location});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const oldBranch = await Map.findOne({
                where: {id},
                include: [{
                    model: MapImages,
                    as: 'images',
                    required: true,
                }],
            });

            if (_.isEmpty(oldBranch)) {
                throw HttpError(404, "Not found branch from that id");
            }

            if(_.isEmpty(files) || _.isEmpty(hasImage)){
                throw HttpError(403, "Doesn't sent image!");

            }

            const updatedBranch = await Map.update(
                {x, y, title, location, fullCoords: `${x}${y}`},
                {where: {id}}
            );

            const filesData = files.map(file => {
                if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
                    const fileName = uuidV4() + '-' + file.originalname;
                    const filePath = path.join('files', fileName);

                    fs.renameSync(file.path, path.join(__dirname, '../public/', filePath));

                    return {
                        name: filePath,
                        size: file.size,
                        branchId: id,
                    }
                }
            });

            await MapImages.destroy({where: {branchId: id}});
            await MapImages.bulkCreate(filesData);

            oldBranch.images.forEach((image) => {
                const delImagePath = Map.getImgPath(image.name);
                if(fs.existsSync(delImagePath)) fs.unlinkSync(delImagePath);
            });

            res.json({
                status: "ok",
                updatedBranch
            })
        } catch (e) {
            if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }
            next(e);
        }
    }

    static deleteBranch = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingBranch = await Map.findOne({
                where: {id},
                include: [{
                    model: MapImages,
                    as: 'images',
                    required: true,
                }],
            });

            if (_.isEmpty(deletingBranch)) {
                throw HttpError(404, "Not found branch from that id");
            }

            const deletedBranch = await Map.destroy({where: {id}});
            await MapImages.destroy({where: {branchId: id}});

            deletingBranch.images.forEach((image) => {
                const delImagePath = Map.getImgPath(image.name);
                if(fs.existsSync(delImagePath)) fs.unlinkSync(delImagePath);
            });

            res.json({
                status: "ok",
                deletedBranch
            });
        } catch (e) {
            next(e);
        }
    };
}
