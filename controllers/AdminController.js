import {Admin, Map} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import {v4 as uuidV4} from "uuid";
import Email from "../services/Email";
import _ from "lodash";
import Validator from "../middlewares/Validator";

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
                email: Validator.email(true),
                password: Validator.password(true),
            }).validate({email, password});

            if (validate.error) {
                throw new HttpError(422, validate.error);
            }

            const admin = await Admin.findOne({where: {email}});

            if (_.isEmpty(admin) || admin.getDataValue('password') !== Admin.passwordHash(password)) {
                throw HttpError(403, 'Invalid login or password');
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
                firstName: Validator.shortText(true),
                lastName: Validator.shortText(true),
                email: Validator.email(true),
                phoneNum: Validator.phone(true),
                password: Validator.password(true),
                confirmPassword: Validator.password(true),
                role: Validator.role(true),
            }).validate({firstName, lastName, email, phoneNum, password, confirmPassword, role});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (confirmPassword !== password) {
                throw HttpError(403, 'Confirm password is wrong!');
            }

            const admin = await Admin.findOne({where: {email}});

            if (admin) {
                if (admin.status === "deleted") {
                    await Admin.destroy({where: {id: admin.id}});
                } else {
                    throw HttpError(422, 'Admin from this email already registered');
                }
            }

            if (branchId) {
                const branch = await Map.findOne({where: {id: branchId}});

                if (_.isEmpty(branch)) {
                    throw HttpError(422, "Can't find branch from this id.");
                }
            }

            const confirmToken = uuidV4();
            const redirectUrl = 'http://localhost:4000/admin/confirm';

            try {
                await Email.sendActivationEmail(email, confirmToken, redirectUrl);
            } catch (e) {
                throw HttpError(422, 'Error in sending email message');
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
                status: 'pending',
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
                email: Validator.email(true),
                token: Validator.token(true),
            }).validate({email, token});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

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
            let {
                firstName,
                lastName,
                phoneNum,
                role,
                branchId
            } = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
                firstName: Validator.shortText(false),
                lastName: Validator.shortText(false),
                phoneNum: Validator.phone(false),
                role: Validator.role(false),
            }).validate({id, firstName, lastName, phoneNum, role});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const admin = await Admin.findOne({where: {id}});

            if (admin.status === 'deleted') {
                throw HttpError(403, 'Admin deleted.');
            }

            if (role === 'admin' || role === 'admin manager') {
                branchId = null;
            }

            if (branchId !== null && branchId !== undefined) {
                const branch = await Map.findOne({where: {id: branchId}});

                if (_.isEmpty(branch)) {
                    throw HttpError(422, "Can't find branch from this id.");
                }
            }

            if (admin.status === 'active') {
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
                id: Validator.numGreatOne(true)
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (id === adminId) {
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
            let {firstName, lastName, phoneNum, email} = req.body;
            let status, confirmToken;

            const validate = Joi.object({
                firstName: Validator.shortText(false),
                lastName: Validator.shortText(false),
                phoneNum: Validator.phone(false),
                email: Validator.email(false),
            }).validate({firstName, lastName, phoneNum, email});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (email) {
                const admin = await Admin.findOne({where: {email}});

                if (!_.isEmpty(admin)) {
                    throw HttpError(403, "This email already exist.");
                }

                confirmToken = uuidV4();
                const redirectUrl = 'http://localhost:4000/admin/confirm';

                try {
                    await Email.sendActivationEmail(email, confirmToken, redirectUrl);
                } catch (e) {
                    throw HttpError(422, 'Error in sending email message');
                }

                status = 'pending';
            }

            await Admin.update({
                firstName,
                lastName,
                phoneNum,
                email,
                status,
                confirmToken
            }, {where: {id: adminId, status: 'active'}});

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
                id: Validator.numGreatOne(true),
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
                email: Validator.email(true),
            }).validate({email});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const admin = await Admin.findOne({where: {email}});

            if (_.isEmpty(admin)) {
                throw HttpError(403, "Invalid email.");
            }

            if (admin.status !== 'active') {
                throw HttpError(403, "Email isn't active.");
            }

            const confirmToken = uuidV4();

            try {
                await Email.sendPasswordChangeEmail(email, confirmToken);
            } catch (e) {
                throw HttpError(403, 'Error in sending email message');
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
                email: Validator.email(true),
                password: Validator.password(true),
                confirmPassword: Validator.password(true),
                token: Validator.token(true),
            }).validate({email, password, confirmPassword, token});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (confirmPassword !== password) {
                throw HttpError(403, 'Invalid confirm password');
            }

            const admin = await Admin.findOne({where: {email}});

            if (_.isEmpty(admin)) {
                throw HttpError(403, "Email isn't valid");
            }

            if (admin.status !== 'active') {
                throw HttpError(403, "Account isn't active");
            }

            if (admin.confirmToken !== token) {
                throw HttpError(403, "Invalid token");
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
