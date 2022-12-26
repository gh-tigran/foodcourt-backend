import {Users} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import { v4 as uuidV4 } from "uuid";
import Email from "../services/Email";
import _ from "lodash";

const {JWT_SECRET} = process.env;
const seqU = Users.sequelize;

class UserController {
    static register = async (req, res, next) => {
        try {
            const {firstName, lastName, email, phoneNum, password, confirmPassword} = req.body;

            const validate = Joi.object({
                firstName: Joi.string().min(2).max(80).required(),
                lastName: Joi.string().min(2).max(80).required(),
                email: Joi.string().min(2).max(50).required(),
                phoneNum: Joi.number().min(1).required(),
                password: Joi.string().min(8).max(50).required(),
                confirmPassword: Joi.string().min(8).max(50).required(),
            }).validate({firstName, lastName, email, phoneNum, password, confirmPassword});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if (confirmPassword !== password) {
                throw HttpError(403, 'Confirm password is wrong!');
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

            if (_.isEmpty(user) || user.getDataValue('password') !== Users.passwordHash(password)) {
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
            let where = {};

            if (name) {
                where.$or = [
                    seqU.where(seqU.fn("concat", seqU.col("firstName"),  ' ', seqU.col("lastName")), {
                        $like: `%${name}%`
                    }),
                    seqU.where(seqU.fn("concat", seqU.col("lastName"),  ' ', seqU.col("firstName")), {
                        $like: `%${name}%`
                    }), {
                        email: { $like: `%${name}%` }
                    }
                ]
            }

            const count = await Users.count({where});
            const totalPages = Math.ceil(count / limit);

            const users = await Users.findAll({
                where,
                offset,
                limit
            });

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

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
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

    static current = async (req, res, next) => {
        try {
            const {userId} = req;

            const user = await Users.findOne({ where: {id: userId} });

            res.json({
                status: 'ok',
                user: user || {}
            });
        } catch (e) {
            next(e);
        }
    };

    static modifyCurrentAccount = async (req, res, next) => {
        try {
            const {firstName, lastName, phoneNum} = req.body;
            const {userId} = req;

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

    static deleteCurrentAccount = async (req, res, next) => {
        try {
            const {userId} = req;

            const deletedAccount = await Users.destroy({where: {id: userId}});

            res.json({
                status: 'ok',
                deletedAccount
            });
        } catch (e) {
            next(e)
        }
    }

    static deleteAccount = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Joi.number().min(1).required(),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const deletedAccount = await Users.destroy({where: {id}});

            res.json({
                status: 'ok',
                deletedAccount
            });
        } catch (e) {
            next(e)
        }
    }

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
            const {email, password, token, confirmPassword} = req.body;

            const validate = Joi.object({
                email: Joi.string().min(10).max(50).required(),
                password: Joi.string().min(8).max(50).required(),
                confirmPassword: Joi.string().min(8).max(50).required(),
                token: Joi.string().min(8).max(50).required(),
            }).validate({email, password, confirmPassword, token});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            if(confirmPassword !== password){
                throw HttpError(403, "Invalid confirm password");
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
