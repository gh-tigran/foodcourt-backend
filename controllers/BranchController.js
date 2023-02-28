import {Admin, Map, MapImages} from "../models";
import path from "path";
import fs from "fs";
import {v4 as uuidV4} from "uuid";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";
import Validator from "../middlewares/Validator";

export default class BranchController {
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
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
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
            const {
                lat,
                lon,
                title,
                location,
                city,
                country,
                phoneNum,
                main
            } = req.body;

            const validate = Joi.object({
                lat: Joi.number().required(),
                lon: Joi.number().required(),
                title: Validator.shortText(true),
                location: Validator.shortText(true),
                city: Validator.shortText(true),
                country: Validator.shortText(true),
                phoneNum: Validator.phone(true),
            }).validate({lat, lon, title, location, city, country, phoneNum});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (_.isEmpty(files)) {
                throw HttpError(403, "Doesn't sent image.");
            }

            const imageFile = files.find(file => ['image/png', 'image/jpeg'].includes(file.mimetype));

            if (_.isEmpty(imageFile)) {
                throw HttpError(403, "Doesn't sent image.");
            }

            const branchFromSameCoords = await Map.findOne({where: {lat, lon}});

            if (!_.isEmpty(branchFromSameCoords)) {
                throw HttpError(403, "Branch from that coords already exist.");
            }

            const mainBranch = await Map.findOne({
                where: {main: 'main'}
            });

            const createdBranch = await Map.create({
                lat,
                lon,
                title,
                location,
                city,
                country,
                phoneNum,
                main: (main === true || main === 'true') && _.isEmpty(mainBranch) ?
                    'main' : 'not main'
            });

            const imagesData = files.map(file => {
                if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
                    const fileName = uuidV4() + '-' + file.originalname;
                    const imagePath = path.join('files', fileName);

                    fs.renameSync(file.path, path.join(__dirname, '../public/', imagePath));

                    return {
                        name: imagePath,
                        size: file.size,
                        branchId: createdBranch.id,
                    }
                }
            });

            await MapImages.bulkCreate(imagesData);

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
            const {
                lat,
                lon,
                title,
                location,
                country,
                city,
                phoneNum,
                main,
                notDeleteImageIdList
            } = req.body;
            let where = {};
            let branchFromSameCoords = {};

            const validate = Joi.object({
                lat: Joi.number().required(),
                lon: Joi.number().required(),
                title: Validator.shortText(false),
                location: Validator.shortText(false),
                city: Validator.shortText(false),
                country: Validator.shortText(false),
                phoneNum: Validator.phone(false),
            }).validate({lat, lon, title, location, city, country, phoneNum});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (lat && lon) where = {lat, lon};

            if (!_.isEmpty(where)) {
                branchFromSameCoords = await Map.findOne({where});
            }

            if (branchFromSameCoords && +branchFromSameCoords.id !== +id) {
                throw HttpError(403, "Branch from that coords already exist!!!");
            }

            const branch = await Map.findOne({
                where: {id},
                include: [{
                    model: MapImages,
                    as: 'images',
                    required: true,
                }],
            });

            if (_.isEmpty(branch)) {
                throw HttpError(403, "Not found branch from that id");
            }

            if(!_.isEmpty(notDeleteImageIdList) || !_.isEmpty(files)){
                branch.images.forEach(image => {
                    const delImagePath = Map.getImgPath(image.name);
                    if (fs.existsSync(delImagePath) && ((notDeleteImageIdList && !notDeleteImageIdList.includes(`${image.id}`)) || !notDeleteImageIdList)) fs.unlinkSync(delImagePath);
                });

                await MapImages.destroy({
                    where: {
                        branchId: id,
                        $and: notDeleteImageIdList ? notDeleteImageIdList.map(tempId => {
                            return {id: {['$not']: tempId}}
                        }) : []
                    }
                });

                if (!_.isEmpty(files)) {
                    const imageFile = files.find(file => ['image/png', 'image/jpeg'].includes(file.mimetype));

                    if (!_.isEmpty(imageFile)) {
                        const imagesData = files.map(file => {
                            if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
                                const imageName = uuidV4() + '-' + file.originalname;
                                const imagePath = path.join('files', imageName);

                                fs.renameSync(file.path, Map.getImgPath(imagePath));

                                return {
                                    name: imagePath,
                                    size: file.size,
                                    branchId: branch.id,
                                }
                            }
                        });

                        await MapImages.bulkCreate(imagesData);
                    }
                }
            }

            const mainBranch = await Map.findOne({
                where: {main: 'main', id: {$not: id}}
            });

            const updatedBranch = await Map.update(
                {
                    lat,
                    lon,
                    title,
                    location,
                    country,
                    city,
                    phoneNum,
                    main: (main === true || main === 'true') && _.isEmpty(mainBranch) ?
                        'main' : 'not main'
                },
                {where: {id}}
            );

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
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const branch = await Map.findOne({
                where: {id},
                include: [{
                    model: MapImages,
                    as: 'images',
                    required: true,
                }],
            });

            if (_.isEmpty(branch)) {
                throw HttpError(403, "Not found branch from that id");
            }

            const deletedBranch = await Map.destroy({where: {id}});

            branch.images.forEach((image) => {
                const delImagePath = Map.getImgPath(image.name);
                if (fs.existsSync(delImagePath)) fs.unlinkSync(delImagePath);
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
