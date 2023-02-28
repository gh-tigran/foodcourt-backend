import {Users} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import { v4 as uuidV4 } from "uuid";
import Email from "../services/Email";
import _ from "lodash";
import Validator from "../middlewares/Validator";

const {JWT_SECRET} = process.env;
const seqU = Users.sequelize;

class UserController {
    static register = async (req, res, next) => {
        try {
            const {
                firstName,
                lastName,
                email,
                phoneNum,
                password,
                confirmPassword
            } = req.body;

            const validate = Joi.object({
                firstName: Validator.shortText(true),
                lastName: Validator.shortText(true),
                email: Validator.email(true),
                phoneNum: Validator.phone(true),
                password: Validator.password(true),
                confirmPassword: Validator.password(true),
            }).validate({firstName, lastName, email, phoneNum, password, confirmPassword});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (confirmPassword !== password) {
                throw HttpError(403, 'Confirm password is wrong!');
            }

            const user = await Users.findOne({ where: {email} });

            if (user) {
                if(user.status === "deleted"){
                    await Users.destroy({where: {id: user.id}});
                }else{
                    throw HttpError(403, 'User from this email already registered');
                }
            }

            const confirmToken = uuidV4();
            const redirectUrl = 'http://localhost:3000/users/confirm';

            try {
                await Email.sendActivationEmail(email, confirmToken, redirectUrl);
            }catch (e){
                throw HttpError(403, 'Error in sending email message');
            }

            const registeredUser = await Users.create({
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
                email: Validator.email(true),
                password: Validator.password(true),
            }).validate({email, password});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const user = await Users.findOne({ where: {email} });

            if (_.isEmpty(user) || user.getDataValue('password') !== Users.passwordHash(password)) {
                throw HttpError(403, 'Invalid email or password');
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

            const validate = Joi.object({
                email: Validator.email(true),
                token: Validator.token(true),
            }).validate({email, token});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

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

    static list = async (req, res, next) =>  {
        try {
            let {page = 1, limit = 10, name} = req.query;

            const validate = Joi.object({
                page: Validator.numGreatOne(true),
                limit: Validator.numGreatOne(true),
                name: Validator.shortText(false),
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
                id:  Validator.numGreatOne(true),
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
            const {firstName, lastName, phoneNum, email} = req.body;
            const {userId} = req;
            let status, confirmToken;

            const validate = Joi.object({
                firstName:  Validator.shortText(false),
                lastName: Validator.shortText(false),
                phoneNum: Validator.phone(false),
                email: Validator.email(false),
            }).validate({firstName, lastName, phoneNum, email});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            if (email) {
                const user = await Users.findOne({where: {email}});

                if (!_.isEmpty(user)) {
                    throw HttpError(403, "This email already exist.");
                }

                confirmToken = uuidV4();
                const redirectUrl = 'http://localhost:3000/users/confirm';

                try {
                    await Email.sendActivationEmail(email, confirmToken, redirectUrl);
                } catch (e) {
                    throw HttpError(422, 'Error in sending email message');
                }

                status = 'pending';
            }

            await Users.update({
                firstName,
                lastName,
                phoneNum,
                email,
                status,
                confirmToken
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
                id: Validator.numGreatOne(true),
                status: Joi.string().valid('blocked', 'active').required(),
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
                email: Validator.email(true),
            }).validate({email});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const admin = await Users.findOne({where: {email}});

            if(_.isEmpty(admin)){
                throw HttpError(403, "Email isn't valid");
            }

            if(admin.confirmToken && admin.status === 'pending'){
                throw HttpError(403, "Email isn't active.");
            }

            const confirmToken = uuidV4();

            try {
                await Email.sendPasswordChangeEmail(email, confirmToken);
            }catch (e){
                throw HttpError(403, 'Error in sending email message');
            }

            await Users.update({
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

            if(confirmPassword !== password){
                throw HttpError(403, "Invalid confirm password");
            }

            const admin = await Users.findOne({where: {email}});

            if(_.isEmpty(admin)){
                throw HttpError(403, "Email isn't valid");
            }

            if(admin.status !== 'active'){
                throw HttpError(403, "Account isn't active");
            }

            if(admin.confirmToken !== token){
                throw HttpError(403, "Invalid token");
            }

            const updatedAccount = await Users.update({
                confirmToken: null,
                password,
            }, {where: {id: admin.id},});

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
