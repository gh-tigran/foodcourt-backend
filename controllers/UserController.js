import {Users} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import { v4 as uuidV4 } from "uuid";
import Email from "../services/Email";
import _ from "lodash";

const {JWT_SECRET} = process.env;

class UserController {
    static register = async (req, res, next) => {
        try {
            const {firstName, lastName, email, phoneNum, password} = req.body;

            const validate = Joi.object({
                firstName: Joi.string().min(2).max(80).required(),
                lastName: Joi.string().min(2).max(80).required(),
                email: Joi.string().min(2).max(50).required(),
                phoneNum: Joi.number().min(1).required(),
                password: Joi.string().min(8).max(50).required(),
            }).validate({firstName, lastName, email, phoneNum, password});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const existsUser = await Users.findOne({ where: {email} });

            if (existsUser) {
                throw HttpError(403, `Email already registered`);
            }

            const confirmToken = uuidV4();
            const redirectUrl = 'http://localhost:4000/users/confirm';

            try {
                const sendEmail = await Email.sendActivationEmail(email, confirmToken, redirectUrl);
            }catch (e){
                throw HttpError(403, {message: `Error in sending email message`});
            }

            const user = await Users.create({
                firstName,
                lastName,
                email,
                password,
                phoneNum,
                confirmToken,
                status: 'pending',
            });

            res.json({
                status: 'ok',
                user
            });
        } catch (e) {
            next(e)
        }
    }

    static login = async (req, res, next) => {
        try {
            const {email, password} = req.body;

            const validate = Joi.object({
                email: Joi.string().min(2).max(50).required(),
                password: Joi.string().min(8).max(50).required(),
            }).validate({email, password});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const user = await Users.findOne({ where: {email} });

            if (!user || user.getDataValue('password') !== Users.passwordHash(password)) {
                throw HttpError(403, 'Wrong email or password');
            }

            if(user.status !== 'active'){
                throw HttpError(403, 'User is not active');
            }

            const token = jwt.sign({userId: user.id}, JWT_SECRET);

            res.json({
                status: 'ok',
                token,
                user
            });
        } catch (e) {
            next(e)
        }
    }

    static modifyAccount = async (req, res, next) => {
        try {
            const {firstName, lastName, phoneNum} = req.body;
            const {userId} = req;

            if(!userId){
                throw HttpError(403, 'not registered');
            }

            const validate = Joi.object({
                firstName: Joi.string().min(2).max(80),
                lastName: Joi.string().min(2).max(80),
                phoneNum: Joi.number().min(1),
            }).validate({firstName, lastName, phoneNum});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatedAccount = await Users.update({
                firstName,
                lastName,
                phoneNum,
            }, {where: {id: userId},});

            res.json({
                status: 'ok',
                updatedAccount
            });
        } catch (e) {
            next(e)
        }
    }

    static deleteAccount = async (req, res, next) => {
        try {
            const {userId} = req;

            if(!userId){
                throw HttpError(403, 'not registered');
            }

            const deletedAccount = await Users.destroy({where: {id: userId}});

            res.json({
                status: 'ok',
                deletedAccount
            });
        } catch (e) {
            next(e)
        }
    }

    static confirm = async (req, res, next) => {
        try {
            const { email, token } = req.query;

            const user = await Users.findOne({
                where: {email, status: 'pending'}
            });

            if (user.confirmToken !== token) {
                throw HttpError(403);
            }

            await Users.activate(email);

            res.json({
                status: 'ok',
                email
            })
        } catch (e) {
            next(e);
        }
    }

    static list = async (req, res, next) => {
        try {
            let {page = 1, limit = 10, name = ''} = req.query;
            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            const {adminId} = req;
            let where = {};

            if(!adminId){
                throw HttpError(403, 'not registered as admin');
            }

            if (name) {
                where.$or = [{
                    firstName: {
                        $like: `%${name}%`
                    }
                }, {
                    lastName: {
                        $like: `%${name}%`
                    }
                }]
            }

            const count = await Users.count({where});
            const totalPages = Math.ceil(count / limit);

            const users = await Users.findAll({
                where,
                offset,
                limit
            });
            console.log(users)
            res.json({
                status: 'ok',
                data: !_.isEmpty(users) ? {
                    users,
                    page,
                    totalPages,
                }: {},
            });
        } catch (e) {
            next(e);
        }
    };

    static single = async (req, res, next) => {
        try {
            const {id} = req.params;
            const {adminId, userId} = req;

            if(!adminId && !userId){
                throw HttpError(403, 'not registered');
            }

            if (!id) {
                throw HttpError(404, 'not send id for get single user');
            }

            const user = await Users.findOne({ where: {id} });

            res.json({
                status: 'ok',
                user: user || {}
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

            const forgetAdmin = await Users.findOne({where: {email}});

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

            await Users.update({
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
            const {email, password, token} = req.body;

            const validate = Joi.object({
                email: Joi.string().min(10).max(50).required(),
                password: Joi.string().min(8).max(50).required(),
                token: Joi.string().min(8).max(50).required(),
            }).validate({email, password, token});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const changeAdmin = await Users.findOne({where: {email}});

            if(_.isEmpty(changeAdmin)){
                throw HttpError(403, "Email isn't valid");
            }

            if(changeAdmin.status !== 'active'){
                throw HttpError(403, "Account isn't active");
            }

            if(changeAdmin.confirmToken !== token){
                throw HttpError(403, "Invalid token");
            }

            const updatedAccount = await Users.update({
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

export default UserController
