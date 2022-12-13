import {Admin} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import { v4 as uuidV4 } from "uuid";
import Email from "../services/Email";

const {JWT_SECRET} = process.env;

class AdminController {
    static admin = async (req, res, next) => {
        try {
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const admin = await Admin.findOne({ where: {id: adminId} });

            res.json({
                status: 'ok',
                admin: admin || {}
            });
        } catch (e) {
            next(e);
        }
    };

    static login = async (req, res, next) => {
        try {
            const {email, password} = req.body;

            const validate = Joi.object({
                email: Joi.string().min(2).max(50).required(),
                password: Joi.string().min(8).max(50).required(),
            }).validate({email, password});

            if (validate.error) {
                throw new HttpError(403, validate.error);
            }

            const admin = await Admin.findOne({ where: {email} });

            if (!admin || admin.getDataValue('password') !== Admin.passwordHash(password)) {
                throw HttpError(403, 'invalid login or password');
            }

            const token = jwt.sign({adminId: admin.id}, JWT_SECRET);

            res.json({
                status: 'ok',
                token,
                admin
            });
        } catch (e) {
            next(e)
        }
    }

    static register = async (req, res, next) => {
        try {
            const {firstName, lastName, email, phoneNum, password, possibility} = req.body;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const admin = await Admin.findOne({where: {id: adminId, possibility: 'senior'}});

            if(!admin){
                throw HttpError(403, 'not registered as senior admin');
            }

            const validate = Joi.object({
                firstName: Joi.string().min(2).max(80).required(),
                lastName: Joi.string().min(2).max(80).required(),
                email: Joi.string().min(2).max(50).required(),
                phoneNum: Joi.number().min(1).required(),
                password: Joi.string().min(8).max(50).required(),
                possibility: Joi.string().valid('junior', 'middle', 'senior').required(),
            }).validate({firstName, lastName, email, phoneNum, password, possibility});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const existsAdmin = await Admin.findOne({ where: {email} });

            if (existsAdmin) {
                throw HttpError(403, {email: `Admin from this email already registered`});
            }

            const confirmToken = uuidV4();
            const redirectUrl = 'http://localhost:4000/admin/confirm';

            try {
                const sendEmail = await Email.sendActivationEmail(email, confirmToken, redirectUrl);
            }catch (e){
                throw HttpError(403, {message: `Error in sending email message`});
            }

            const createdAdmin = await Admin.create({
                firstName,
                lastName,
                email,
                password,
                phoneNum,
                confirmToken,
                possibility,
                status: 'pending',
            });

            res.json({
                status: 'ok',
                createdAdmin
            });
        } catch (e) {
            next(e)
        }
    }

    static confirm = async (req, res, next) => {
        try {
            const { email, token } = req.query;

            const admin = await Admin.findOne({
                where: {email, status: 'pending'}
            });

            if (admin.confirmToken !== token) {
                throw HttpError(403);
            }

            await Admin.activate(email);

            res.json({
                status: 'ok',
                email
            });
        } catch (e) {
            next(e);
        }
    }

    static modifyAccount = async (req, res, next) => {
        try {
            const {id} = req.params;
            const {firstName, lastName, phoneNum, password, possibility} = req.body;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const admin = await Admin.findOne({where: {id: adminId}});

            if(!admin){
                throw HttpError(403, 'not registered as admin');
            }

            if(possibility && admin.possibility !== 'senior'){
                throw HttpError(403, 'not registered as senior admin');
            }

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
                firstName: Joi.string().min(2).max(80),
                lastName: Joi.string().min(2).max(80),
                phoneNum: Joi.number().min(1),
                password: Joi.string().min(8).max(50),
                possibility: Joi.string().valid('junior', 'middle', 'senior'),
            }).validate({id, firstName, lastName, phoneNum, password, possibility});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatedAdmin = await Admin.update({
                firstName,
                lastName,
                phoneNum,
                password,
                possibility
            }, {where: {id}});

            res.json({
                status: 'ok',
                updatedAdmin
            });
        } catch (e) {
            next(e)
        }
    }

    static deleteAccount = async (req, res, next) => {
        try {
            const {id} = req.params;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const admin = await Admin.findOne({where: {id: adminId, possibility: 'senior'}});

            if(!admin){
                throw HttpError(403, 'not registered as senior admin');
            }

            const deletedAdmin = await Admin.destroy({where: {id}});

            res.json({
                status: 'ok',
                deletedAdmin
            });
        } catch (e) {
            next(e)
        }
    }

    static list = async (req, res, next) => {
        try {
            const {search} = req.query;
            const where = {};
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            const admin = await Admin.findOne({where: {id: adminId, possibility: 'senior'}});

            if(!admin){
                throw HttpError(403, 'not registered as senior admin');
            }

            if (search) {
                where.$or = [{
                    firstName: {
                        $like: `%${search}%`
                    }
                }, {
                    lastName: {
                        $like: `%${search}%`
                    }
                }]
            }

            const admins = await Admin.findAll({ where });

            res.json({
                status: 'ok',
                admins
            });
        } catch (e) {
            next(e);
        }
    };

    static single = async (req, res, next) => {
        try {
            const {id} = req.params;
            const {adminId} = req;

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            if (!id) {
                throw HttpError(404);
            }

            const admin = await Admin.findOne({ where: {id} });

            res.json({
                status: 'ok',
                admin: admin || {}
            });
        } catch (e) {
            next(e);
        }
    };
}

export default AdminController
