import {Admin, Map} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import {v4 as uuidV4} from "uuid";
import Email from "../services/Email";
import _ from "lodash";
import Validator from "../middlewares/Validator";
import {joiErrorMessage} from "../services/JoiConfig";

const {JWT_SECRET} = process.env;

class AdminController {
    static currentAdmin = async (req, res, next) => {
        try {
            const {adminId} = req;

            const admin = await Admin.findOne({where: {id: adminId}});

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
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
                password: Validator.password(true).error(new Error(joiErrorMessage.password)),
            }).validate({email, password});

            if (validate.error) {
                throw new HttpError(422, validate.error);
            }

            const admin = await Admin.findOne({where: {email}});

            if (_.isEmpty(admin) || admin.getDataValue('password') !== Admin.passwordHash(password)) {
                throw HttpError(403, 'Неправильный логин или пароль');
            }

            if (admin.status !== 'активный') {
                throw HttpError(403, 'Админ не активен');
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
            const {
                firstName,
                lastName,
                email,
                phoneNum,
                password,
                confirmPassword,
                role,
                branchId,
            } = req.body;

            const validate = Joi.object({
                firstName: Validator.shortText(true).error(new Error(joiErrorMessage.firstName)),
                lastName: Validator.shortText(true).error(new Error(joiErrorMessage.lastName)),
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
                phoneNum: Validator.phone(true).error(new Error(joiErrorMessage.phoneNum)),
                password: Validator.password(true).error(new Error(joiErrorMessage.password)),
                confirmPassword: Validator.password(true).error(new Error(joiErrorMessage.confirmPassword)),
                role: Validator.role(true).error(new Error(joiErrorMessage.role)),
            }).validate({firstName, lastName, email, phoneNum, password, confirmPassword, role});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (confirmPassword !== password) {
                throw HttpError(403, 'Неверный пароль для подтверждения');
            }

            const admin = await Admin.findOne({where: {email}});

            if (admin) {
                if (admin.status === "удален") {
                    await Admin.destroy({where: {id: admin.id}});
                } else {
                    throw HttpError(422, 'Админ с этого адреса уже зарегистрирован');
                }
            }

            if (branchId) {
                const branch = await Map.findOne({where: {id: branchId}});

                if (_.isEmpty(branch)) {
                    throw HttpError(422, "Не удается найти ветку с этот id");
                }
            }

            const confirmToken = uuidV4();
            const redirectUrl = 'http://localhost:4000/admin/confirm';

            try {
                await Email.sendActivationEmail(email, confirmToken, redirectUrl);
            } catch (e) {
                throw HttpError(422, 'Ошибка отправки сообщения электронной почты');
            }

            const registeredAdmin = await Admin.create({
                firstName,
                lastName,
                email,
                password,
                phoneNum,
                confirmToken,
                role,
                branchId,
                status: 'в ожидании',
            });

            res.json({
                status: 'ok',
                registeredAdmin
            });
        } catch (e) {
            next(e)
        }
    }

    static confirm = async (req, res, next) => {
        try {
            const {email, token} = req.query;

            const validate = Joi.object({
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
                token: Validator.token(true).error(new Error(joiErrorMessage.token)),
            }).validate({email, token});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const admin = await Admin.findOne({
                where: {email, status: 'в ожидании'}
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
            let {
                firstName,
                lastName,
                phoneNum,
                role,
                branchId
            } = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
                firstName: Validator.shortText(false).error(new Error(joiErrorMessage.firstName)),
                lastName: Validator.shortText(false).error(new Error(joiErrorMessage.lastName)),
                phoneNum: Validator.phone(false).error(new Error(joiErrorMessage.phoneNum)),
                role: Validator.role(false).error(new Error(joiErrorMessage.role)),
            }).validate({id, firstName, lastName, phoneNum, role});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const admin = await Admin.findOne({where: {id}});

            if (admin.status === 'удален') {
                throw HttpError(403, 'Админ удален');
            }

            if (role === 'владелец' || role === 'супер админ') {
                branchId = null;
            }

            if (branchId !== null && branchId !== undefined) {
                const branch = await Map.findOne({where: {id: branchId}});

                if (_.isEmpty(branch)) {
                    throw HttpError(422, "Не удается найти ветку с этот id");
                }
            }

            if (admin.status === 'активный') {
                firstName = undefined;
                lastName = undefined;
                phoneNum = undefined;
            }

            const updatedAdmin = await Admin.update({
                firstName,
                lastName,
                phoneNum,
                role,
                branchId,
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
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id))
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (id === adminId) {
                throw HttpError(403);
            }

            const deletedAdmin = await Admin.update({
                status: 'удален'
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
            let {firstName, lastName, phoneNum, email} = req.body;
            let status, confirmToken;

            const validate = Joi.object({
                firstName: Validator.shortText(false).error(new Error(joiErrorMessage.firstName)),
                lastName: Validator.shortText(false).error(new Error(joiErrorMessage.lastName)),
                phoneNum: Validator.phone(false).error(new Error(joiErrorMessage.phoneNum)),
                email: Validator.email(false).error(new Error(joiErrorMessage.email)),
            }).validate({firstName, lastName, phoneNum, email});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (email) {
                const admin = await Admin.findOne({where: {email}});

                if (!_.isEmpty(admin)) {
                    throw HttpError(403, "Этот адрес электронной почты уже существует");
                }

                confirmToken = uuidV4();
                const redirectUrl = 'http://localhost:4000/admin/confirm';

                try {
                    await Email.sendActivationEmail(email, confirmToken, redirectUrl);
                } catch (e) {
                    throw HttpError(422, 'Ошибка отправки сообщения электронной почты');
                }

                status = 'в ожидании';
            }

            await Admin.update({
                firstName,
                lastName,
                phoneNum,
                email,
                status,
                confirmToken
            }, {where: {id: adminId, status: 'активный'}});

            const updatedAdmin = await Admin.findOne({where: {id: adminId}});

            res.json({
                status: 'ok',
                updatedAdmin
            });
        } catch (e) {
            next(e)
        }
    }

    static list = async (req, res, next) => {
        try {
            const {adminId} = req;

            const admins = await Admin.findAll({
                where: {
                    id: {$not: adminId}
                }
            });

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
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const admin = await Admin.findOne({where: {id}});

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
                email: Validator.email(true).error(new Error(joiErrorMessage.email)),
            }).validate({email});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const admin = await Admin.findOne({where: {email}});

            if (_.isEmpty(admin)) {
                throw HttpError(403, "Неверный адрес электронной почты");
            }

            if (admin.status !== 'активный') {
                throw HttpError(403, "Электронная почта не активна");
            }

            const confirmToken = uuidV4();

            try {
                await Email.sendPasswordChangeEmail(email, confirmToken);
            } catch (e) {
                throw HttpError(403, 'Ошибка отправки сообщения электронной почты');
            }

            await Admin.update({
                confirmToken,
            }, {where: {id: admin.id},});

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

            if (confirmPassword !== password) {
                throw HttpError(403, 'Неверный пароль для подтверждения');
            }

            const admin = await Admin.findOne({where: {email}});

            if (_.isEmpty(admin)) {
                throw HttpError(403, "Неверный адрес электронной почты");
            }

            if (admin.status !== 'активный') {
                throw HttpError(403, "Аккаунт не активен");
            }

            if (admin.confirmToken !== token) {
                throw HttpError(403, "Недействительный токен");
            }

            const account = await Admin.update({
                confirmToken: null,
                password,
            }, {where: {id: admin.id}});

            res.json({
                status: 'ok',
                account,
            });
        } catch (e) {
            next(e)
        }
    }
}

export default AdminController
