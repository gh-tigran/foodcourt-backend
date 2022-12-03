import {Users} from "../models";
import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import Joi from "joi";
import { v4 as uuidV4 } from "uuid";
import Email from "../services/Email";

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
                throw HttpError(403, {email: `Email already registered`});
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

            const user = await Users.findOne({ where: {email} });

            if (!user || user.getDataValue('password') !== Users.passwordHash(password)) {
                throw HttpError(403);
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
            const {firstName, lastName, phoneNum, password} = req.body;
            const {userId} = req;

            if(!userId){
                throw HttpError(403, {message: 'not registered, controller'});
            }

            const validate = Joi.object({
                firstName: Joi.string().min(2).max(80),
                lastName: Joi.string().min(2).max(80),
                phoneNum: Joi.number().min(1),
                password: Joi.string().min(8).max(50),
            }).validate({firstName, lastName, phoneNum, password});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const updatedAccount = await Users.update({
                firstName,
                lastName,
                phoneNum,
                password
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
                throw HttpError(403, {message: 'not registered'});
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

    static list = async (req, res, next) => {//todo modify(only admin will get all users list)
        try {
            const {search} = req.query;
            const where = {};

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

            const users = await Users.findAll({ where });

            res.json({
                status: 'ok',
                users
            });
        } catch (e) {
            next(e);
        }
    };

    static single = async (req, res, next) => {
        try {
            const {id} = req.params;

            if (!id) {
                throw HttpError(404);
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
}

export default UserController
