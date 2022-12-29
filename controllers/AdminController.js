import {Admin} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import { v4 as uuidV4 } from "uuid";
import Email from "../services/Email";
import _ from "lodash";

const {JWT_SECRET} = process.env;

class AdminController {
    static currentAdmin = async (req, res, next) => {
        try {
            const {adminId} = req;

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

            if (_.isEmpty(admin)  || admin.getDataValue('password') !== Admin.passwordHash(password)) {
                throw HttpError(403, 'invalid login or password');
            }

            if (admin.status !== 'active') {
                throw HttpError(403, 'Admin is not active!');
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
            const {firstName, lastName, email, phoneNum, password, possibility, confirmPassword} = req.body;

            const validate = Joi.object({
                firstName: Joi.string().min(2).max(80).required(),
                lastName: Joi.string().min(2).max(80).required(),
                email: Joi.string().min(2).max(50).required(),
                phoneNum: Joi.number().min(1).required(),
                password: Joi.string().min(8).max(50).required(),
                confirmPassword: Joi.string().min(8).max(50).required(),
                possibility: Joi.string().valid('junior', 'middle', 'senior').required(),
            }).validate({firstName, lastName, email, phoneNum, password, confirmPassword, possibility});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if (confirmPassword !== password) {
                throw HttpError(403, 'Confirm password is wrong!');
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

            if (_.isEmpty(admin) || admin.confirmToken !== token) {
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
            let {firstName, lastName, phoneNum, possibility} = req.body;

            const admin = await Admin.findOne({where: {id}});

            if(admin.status === 'deleted'){
                throw HttpError(403, 'Admin deleted!');
            }

            if(admin.status === 'active'){
                firstName = undefined;
                lastName = undefined;
                phoneNum = undefined;
            }

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
                firstName: Joi.string().min(2).max(80),
                lastName: Joi.string().min(2).max(80),
                phoneNum: Joi.number().min(1),
                possibility: Joi.string().valid('junior', 'middle', 'senior'),
            }).validate({id, firstName, lastName, phoneNum, possibility});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatedAdmin = await Admin.update({
                firstName,
                lastName,
                phoneNum,
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

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(id === adminId){
                throw HttpError(403);
            }

            const deletedAdmin = await Admin.update({
                status: 'deleted'
            }, {where: {id}});

            res.json({
                status: 'ok',
                deletedAdmin
            });
        } catch (e) {
            next(e)
        }
    }

    static modifyCurrentAccount = async (req, res, next) => {
        try {
            const {adminId} = req;
            let {firstName, lastName, phoneNum} = req.body;

            const validate = Joi.object({
                firstName: Joi.string().min(2).max(80),
                lastName: Joi.string().min(2).max(80),
                phoneNum: Joi.number().min(1),
            }).validate({firstName, lastName, phoneNum});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatedAdmin = await Admin.update({
                firstName,
                lastName,
                phoneNum,
            }, {where: {id: adminId, status: 'active'}});

            res.json({
                status: 'ok',
                updatedAdmin
            });
        } catch (e) {
            next(e)
        }
    }

    // static deleteCurrentAccount = async (req, res, next) => {
    //     try {
    //         const {adminId} = req;
    //
    //         const deletedAdmin = await Admin.update({
    //             status: 'deleted'
    //         }, {where: {id: adminId}});
    //
    //         res.json({
    //             status: 'ok',
    //             deletedAdmin
    //         });
    //     } catch (e) {
    //         next(e)
    //     }
    // }

    static list = async (req, res, next) => {
        try {
            const admins = await Admin.findAll();

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

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
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

    static forgetPassword = async (req, res, next) => {
        try {
            const {email} = req.body;

            const validate = Joi.object({
                email: Joi.string().min(10).max(50).required(),
            }).validate({email});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const forgetAdmin = await Admin.findOne({where: {email}});

            if(_.isEmpty(forgetAdmin)){
                throw HttpError(403, "Email isn't valid");
            }

            if(forgetAdmin.confirmToken && forgetAdmin.status === 'pending'){
                throw HttpError(403, "Email isn't active. Please activate account by token from email before changing password");
            }

            const confirmToken = uuidV4();

            try {
                await Email.sendPasswordChangeEmail(email, confirmToken);
            }catch (e){
                throw HttpError(403, {message: `Error in sending email message`});
            }

            await Admin.update({
                confirmToken,
            }, {where: {id: forgetAdmin.id},});

            res.json({
                status: 'ok',
            });
        } catch (e) {
            next(e)
        }
    }

    static changePassword = async (req, res, next) => {
        try {
            const {email, password, confirmPassword, token} = req.body;

            const validate = Joi.object({
                email: Joi.string().min(10).max(50).required(),
                password: Joi.string().min(8).max(50).required(),
                confirmPassword: Joi.string().min(8).max(50).required(),
                token: Joi.string().min(8).max(50).required(),
            }).validate({email, password, confirmPassword, token});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if (confirmPassword !== password) {
                throw HttpError(403, 'Invalid confirm password');
            }

            const changeAdmin = await Admin.findOne({where: {email}});

            if(_.isEmpty(changeAdmin)){
                throw HttpError(403, "Email isn't valid");
            }

            if(changeAdmin.status !== 'active'){
                throw HttpError(403, "Account isn't active");
            }

            if(changeAdmin.confirmToken !== token){
                throw HttpError(403, "Invalid token");
            }

            const updatedAccount = await Admin.update({
                confirmToken: null,
                password,
            }, {where: {id: changeAdmin.id},});

            res.json({
                status: 'ok',
                user: updatedAccount,
            });
        } catch (e) {
            next(e)
        }
    }
}

export default AdminController
