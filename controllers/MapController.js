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
            const {slugName} = req.params;

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const singleBranch = await Map.findOne({
                where: {slugName},
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
            const {lat, lon, title, location} = req.body;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const validate = Joi.object({
                lat: Joi.number().required(),
                lon: Joi.number().required(),
                title: Joi.string().min(2).max(80).required(),
                location: Joi.string().min(2).max(80).required(),
            }).validate({lat, lon, title, location});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if (_.isEmpty(files)) {
                throw HttpError(403, "Doesn't sent image!");
            }

            const hasImage = files.find(file => ['image/png', 'image/jpeg'].includes(file.mimetype));
            const isExistBranchFromThatCoords = await Map.findOne({where: {lat, lon}});

            if (!_.isEmpty(isExistBranchFromThatCoords)) {
                throw HttpError(403, "Branch from that coords already exist!!!");
            }

            if (_.isEmpty(hasImage)) {
                throw HttpError(403, "Doesn't sent image!");
            }

            const slugName = await Map.generateSlug(location);

            const createdBranch = await Map.create({lat, lon, title, slugName, location});

            const filesData = files.map(file => {
                if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
                    const fileName = uuidV4() + '-' + file.originalname;
                    const filePath = path.join('files', fileName);

                    fs.renameSync(file.path, path.join(__dirname, '../public/', filePath));

                    return {
                        name: filePath,
                        size: file.size,
                        branchId: createdBranch.id,
                        branchSlug: createdBranch.slugName,
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
            const {slugName} = req.params;
            const {lat, lon, title, location} = req.body;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
                lat: Joi.number().min(0),
                lon: Joi.number().min(0),
                title: Joi.string().min(2).max(80),
                location: Joi.string().min(2).max(80),
            }).validate({slugName, lat, lon, title, location});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            let where = {};
            let slugNameUpdate = '';
            let isExistBranchFromThatCoords = {};

            if (lat) where = {lat};

            if (lon) where = {...where, lon};

            if (!_.isEmpty(where)) {
                isExistBranchFromThatCoords = await Map.findOne({where});
            }

            const oldBranch = await Map.findOne({
                where: {slugName},
                include: [{
                    model: MapImages,
                    as: 'images',
                    required: true,
                }],
            });

            if (_.isEmpty(oldBranch)) {
                throw HttpError(404, "Not found branch from that slugName");
            }

            if (!_.isEmpty(isExistBranchFromThatCoords)) {
                throw HttpError(403, "Branch from that coords already exist!!!");
            }

            if (location && location !== oldBranch.location) {
                slugNameUpdate = await Map.generateSlug(location);
            }

            if (!_.isEmpty(files)) {
                const hasImage = files.find(file => ['image/png', 'image/jpeg'].includes(file.mimetype));

                if (!_.isEmpty(hasImage)) {
                    const filesData = files.map(file => {
                        if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
                            const fileName = uuidV4() + '-' + file.originalname;
                            const filePath = path.join('files', fileName);

                            fs.renameSync(file.path, Map.getImgPath(filePath));

                            return {
                                name: filePath,
                                size: file.size,
                                branchId: oldBranch.id,
                                branchSlug: slugNameUpdate || slugName,
                            }
                        }
                    });

                    await MapImages.destroy({where: {branchSlug: slugName}});
                    await MapImages.bulkCreate(filesData);

                    oldBranch.images.forEach((image) => {
                        const delImagePath = Map.getImgPath(image.name);
                        if (fs.existsSync(delImagePath)) fs.unlinkSync(delImagePath);
                    });
                }
            } else if (location) {
                oldBranch.images.forEach((image) => {
                    (async () => {
                        await MapImages.update(
                            {branchSlug: slugNameUpdate},
                            {where: {branchSlug: image.branchSlug}}
                        )
                    })()
                });
            }

            const updatedBranch = await Map.update(
                {
                    slugName: slugNameUpdate || slugName,
                    lat,
                    lon,
                    title,
                    location,
                },
                {where: {slugName}}
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
            const {slugName} = req.params;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const validate = Joi.object({
                slugName: Joi.string().min(2).max(80).required(),
            }).validate({slugName});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletingBranch = await Map.findOne({
                where: {slugName},
                include: [{
                    model: MapImages,
                    as: 'images',
                    required: true,
                }],
            });

            if (_.isEmpty(deletingBranch)) {
                throw HttpError(404, "Not found branch from that slugName");
            }

            const deletedBranch = await Map.destroy({where: {slugName}});

            deletingBranch.images.forEach((image) => {
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

    // static updateBranch = async (req, res, next) => {
    //     try {
    //         const {files} = req;
    //         const {slugName} = req.params;
    //         const {lat, lon, title, location} = req.body;
    //
    //         const validate = Joi.object({
    //             slugName: Joi.string().min(2).max(80).required(),
    //             lat: Joi.number().min(0).required(),
    //             lon: Joi.number().min(0).required(),
    //             title: Joi.string().min(2).max(80).required(),
    //             location: Joi.string().min(2).max(80).required(),
    //         }).validate({slugName, lat, lon, title, location});
    //
    //         if (validate.error) {
    //             throw HttpError(403, validate.error);
    //         }
    //
    //         const oldBranch = await Map.findOne({
    //             where: {slugName},
    //             include: [{
    //                 model: MapImages,
    //                 as: 'images',
    //                 required: true,
    //             }],
    //         });
    //
    //         if (_.isEmpty(oldBranch)) {
    //             throw HttpError(404, "Not found branch from that slugName");
    //         }
    //
    //         if(_.isEmpty(files)){
    //             throw HttpError(403, "Doesn't sent image!");
    //
    //         }
    //
    //         const hasImage = files.find(file => ['image/png', 'image/jpeg'].includes(file.mimetype));
    //
    //         if(_.isEmpty(hasImage)){
    //             throw HttpError(403, "Doesn't sent image!");
    //
    //         }
    //
    //         const slugNameUpdate = await Map.generateSlug(title);
    //         const updatedBranch = await Map.update(
    //             {lat, lon, title, location, slugName: slugNameUpdate, /*fullCoords: `${x}${y}`*/},
    //             {where: {slugName}}
    //         );
    //
    //         const filesData = files.map(file => {
    //             if (['image/png', 'image/jpeg'].includes(file.mimetype)) {
    //                 const fileName = uuidV4() + '-' + file.originalname;
    //                 const filePath = path.join('files', fileName);
    //
    //                 fs.renameSync(file.path, path.join(__dirname, '../public/', filePath));
    //
    //                 return {
    //                     name: filePath,
    //                     size: file.size,
    //                     branchId: oldBranch.id,
    //                     branchSlug: slugNameUpdate,
    //                 }
    //             }
    //         });
    //
    //         await MapImages.destroy({where: {branchSlug: slugName}});
    //         await MapImages.bulkCreate(filesData);
    //
    //         oldBranch.images.forEach((image) => {
    //             const delImagePath = Map.getImgPath(image.name);
    //             if(fs.existsSync(delImagePath)) fs.unlinkSync(delImagePath);
    //         });
    //
    //         res.json({
    //             status: "ok",
    //             updatedBranch
    //         })
    //     } catch (e) {
    //         if (!_.isEmpty(req.file) && fs.existsSync(req.file.path)) {
    //             fs.unlinkSync(req.file.path);
    //         }
    //         next(e);
    //     }
    // }
}
