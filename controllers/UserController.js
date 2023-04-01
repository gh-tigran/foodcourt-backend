import {Users} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import { v4 as uuidV4 } from "uuid";
import Email from "../services/Email";
import _ from "lodash";
import Validator from "../middlewares/Validator";
import {joiErrorMessage} from "../services/JoiConfig";

const {JWT_SECRET} = process.env;
const seqU = Users.sequelize;

class UserController {
    static register = async (req, res, next) => {
        try {
            const {
                firstName,
                email,
                phoneNum,
                password,
                confirmPassword
            } = req.body;

            const validate = Joi.object({
                firstName: Validator.shortText(true).error(new Error(joiErrorMessage.firstName)),
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
                phoneNum: Validator.phone(true).error(new Error(joiErrorMessage.phoneNum)),
                password: Validator.password(true).error(new Error(joiErrorMessage.password)),
                confirmPassword: Validator.password(true).error(new Error(joiErrorMessage.confirmPassword)),
            }).validate({firstName, email, phoneNum, password, confirmPassword});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (confirmPassword !== password) {
                throw HttpError(403, 'Неверный пароль для подтверждения');
            }

            const user = await Users.findOne({ where: {email} });

            if (user) {
                if(user.status === "удален"){
                    await Users.destroy({where: {id: user.id}});
                }else{
                    throw HttpError(403, 'Пользователь с этого адреса электронной почты уже зарегистрирован');
                }
            }

            const confirmToken = uuidV4();
            const redirectUrl = 'http://localhost:3000/users/confirm';

            try {
                await Email.sendActivationEmail(email, confirmToken, redirectUrl);
            }catch (e){
                throw HttpError(403, 'Ошибка отправки сообщения электронной почты');
            }

            const registeredUser = await Users.create({
                firstName,
                email,
                password,
                phoneNum,
                confirmToken,
                status: 'в ожидании',
            });

            res.json({
                status: 'ok',
                registeredUser
            });
        } catch (e) {
            next(e)
        }
    }

    static login = async (req, res, next) => {
        try {
            const {email, password} = req.body;

            const validate = Joi.object({
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
                password: Validator.password(true).error(new Error(joiErrorMessage.password)),
            }).validate({email, password});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const user = await Users.findOne({ where: {email} });

            if (_.isEmpty(user) || user.getDataValue('password') !== Users.passwordHash(password)) {
                throw HttpError(403, 'Неправильный адрес электронной почты или пароль');
            }

            if(user.status !== 'активный'){
                throw HttpError(403, 'Пользователь не активен');
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

            const validate = Joi.object({
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
                token: Validator.token(true).error(new Error(joiErrorMessage.token)),
            }).validate({email, token});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const user = await Users.findOne({
                where: {email, status: 'в ожидании'}
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

    static list = async (req, res, next) =>  {
        try {
            let {page = 1, limit = 10, name} = req.query;

            const validate = Joi.object({
                page: Validator.numGreatOne(true).error(new Error(joiErrorMessage.parameter)),
                limit: Validator.numGreatOne(true).error(new Error(joiErrorMessage.parameter)),
                name: Validator.shortText(false).error(new Error(joiErrorMessage.parameter)),
            }).validate({page, limit, name});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            page = +page;
            limit = +limit;
            const offset = (page - 1) * limit;
            let where = {};

            if (name) {
                name = name.trim();
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
                id:  Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
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
            const {firstName, phoneNum} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                firstName:  Validator.shortText(false).error(new Error(joiErrorMessage.firstName)),
                phoneNum: Validator.phone(false).error(new Error(joiErrorMessage.phoneNum)),
            }).validate({firstName, phoneNum});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            await Users.update({
                firstName,
                phoneNum,
            }, {where: {id: userId},});

            const updatedAccount = await Users.findOne({where: {id: userId}})

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

            const deletedAccount = await Users.update({
                status: 'deleted'
            }, {where: {id: userId}});

            res.json({
                status: 'ok',
                deletedAccount
            });
        } catch (e) {
            next(e)
        }
    }

    static changeAccountStatus = async (req, res, next) => {
        try {
            const {id} = req.params;
            const {status} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
                status: Joi.string().valid('заблокирован', 'активный').required().error(new Error(joiErrorMessage.status)),
            }).validate({id, status});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            await Users.update({
                status,
            }, {where: {id}});

            res.json({
                status: 'ok',
            });
        } catch (e) {
            next(e)
        }
    }

    static forgetPassword = async (req, res, next) => {
        try {
            const {email} = req.body;

            const validate = Joi.object({
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
            }).validate({email});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const user = await Users.findOne({where: {email}});

            if(_.isEmpty(user)){
                throw HttpError(403, "Неверный адрес электронной почты");
            }

            if(user.confirmToken && user.status === 'в ожидании'){
                throw HttpError(403, "Электронная почта не активна");
            }

            const confirmToken = uuidV4();

            try {
                await Email.sendPasswordChangeEmail(email, confirmToken);
            }catch (e){
                throw HttpError(403, 'Ошибка отправки сообщения электронной почты');
            }

            await Users.update({
                confirmToken,
            }, {where: {id: user.id},});

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
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
                password: Validator.password(true).error(new Error(joiErrorMessage.password)),
                confirmPassword: Validator.password(true).error(new Error(joiErrorMessage.confirmPassword)),
                token: Validator.token(true).error(new Error(joiErrorMessage.token)),
            }).validate({email, password, confirmPassword, token});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if(confirmPassword !== password){
                throw HttpError(403, "Неверный пароль для подтверждения");
            }

            const user = await Users.findOne({where: {email}});

            if(_.isEmpty(user)){
                throw HttpError(403, "Неверный адрес электронной почты");
            }

            if(user.status !== 'активный'){
                throw HttpError(403, "Электронная почта не активна");
            }

            if(user.confirmToken !== token){
                throw HttpError(403, "Неправильный ключ");
            }

            const updatedAccount = await Users.update({
                confirmToken: null,
                password,
            }, {where: {id: user.id},});

            res.json({
                status: 'ok',
                user: updatedAccount,
            });
        } catch (e) {
            next(e)
        }
    }

    static changeEmailStep1 = async (req, res, next) => {
        try {
            const {email} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
            }).validate({email});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const user = await Users.findOne({where: {email}});

            if (!_.isEmpty(user)) {
                throw HttpError(403, "Пользователь с этого адреса электронной почты уже зарегистрирован");
            }

            const confirmToken = uuidV4();

            try {
                await Email.sendPasswordChangeEmail(email, confirmToken);
            } catch (e) {
                throw HttpError(422, 'Ошибка отправки сообщения электронной почты');
            }

            await Users.update({
                confirmToken
            }, {where: {id: userId},});

            res.json({
                status: 'ok',
            });
        } catch (e) {
            next(e)
        }
    }

    static changeEmailStep2 = async (req, res, next) => {
        try {
            const {email, token} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
                token: Validator.token(true).error(new Error(joiErrorMessage.token)),
            }).validate({email, token});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const user = await Users.findOne({where: {id: userId}});

            if(user.status !== 'активный'){
                throw HttpError(403, "Электронная почта не активна");
            }

            if(user.confirmToken !== token){
                throw HttpError(403, "Неправильный ключ");
            }

            await Users.update({
                confirmToken: null,
                email,
            }, {where: {id: userId},});

            res.json({
                status: 'ok',
            });
        } catch (e) {
            next(e)
        }
    }
}

export default UserController
