import {PaymentTypes} from "../models";
import Joi from "joi";
import Validator from "../middlewares/Validator";
import HttpError from "http-errors";
import _ from 'lodash';
import {joiErrorMessage} from "../services/JoiConfig";

export default class CategoriesController {
    static getPaymentTypes = async (req, res, next) => {
        try {
            const paymentTypes = await PaymentTypes.findAll();

            res.json({
                status: "ok",
                paymentTypes
            });
        } catch (e) {
            next(e);
        }
    }

    static getAllowedPaymentTypes = async (req, res, next) => {
        try {
            const paymentTypes = await PaymentTypes.findAll({where: {allowUse: 't'}});

            res.json({
                status: "ok",
                paymentTypes
            });
        } catch (e) {
            next(e);
        }
    }

    static getSinglePaymentType = async (req, res, next) => {
        const {id} = req.params;

        try {
            const singlePaymentType = await PaymentTypes.findOne({where: {id}});

            res.json({
                status: "ok",
                singlePaymentType
            });
        } catch (e) {
            next(e);
        }
    }

    static addPaymentType = async (req, res, next) => {
        try {
            const {type, typeName, allowUse} = req.body;

            const validate = Joi.object({
                type: Validator.shortText(true).error(new Error(joiErrorMessage.paymentType)),
                typeName: Validator.shortText(true).error(new Error(joiErrorMessage.paymentTypeName)),
            }).validate({type, typeName});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const paymentType = await PaymentTypes.findOne({
                where: {
                    $or: [
                        {type},
                        {typeName},
                    ]
                }
            });

            if(!_.isEmpty(paymentType)){
                throw HttpError(403, 'Этот тип платежа уже существует');
            }

            const addedPaymentType = await PaymentTypes.create({
                type,
                typeName,
                allowUse: allowUse ? 't' : 'f',
            })

            res.json({
                status: "ok",
                addedPaymentType
            });
        } catch (e) {
            next(e);
        }
    }

    static updatePaymentType = async (req, res, next) => {
        try {
            const {id} = req.params;
            const {type, typeName, allowUse} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
                type: Validator.shortText(false).error(new Error(joiErrorMessage.paymentType)),
                typeName: Validator.shortText(false).error(new Error(joiErrorMessage.paymentTypeName)),
            }).validate({id, type, typeName});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const paymentType = await PaymentTypes.findOne({
                where: { id }
            });

            if(_.isEmpty(paymentType)){
                throw HttpError(403, "Не нашел тип оплаты");
            }

            const paymentTypeBySameValue = await PaymentTypes.findOne({
                where: {
                    $or: [
                        {type: type || ''},
                        {typeName: typeName || ''},
                    ]
                }
            });

            if(!_.isEmpty(paymentTypeBySameValue) && paymentTypeBySameValue.id !== paymentType.id){
                throw HttpError(403, 'Этот тип платежа уже существует');
            }

            const updatedPaymentType = await PaymentTypes.update({
                type,
                typeName,
                allowUse: allowUse ? 't' : 'f',
            }, {where: {id}});

            res.json({
                status: "ok",
                updatedPaymentType
            });
        } catch (e) {
            next(e);
        }
    }

    static deletePaymentType = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const paymentType = await PaymentTypes.findOne({
                where: { id }
            });

            if(_.isEmpty(paymentType)){
                throw HttpError(403, "Не нашел тип оплаты");
            }

            const deletedPaymentType = await PaymentTypes.destroy(
                {where: {id}}
            );

            res.json({
                status: "ok",
                deletedPaymentType
            });
        } catch (e) {
            next(e);
        }
    }

    static allowPay = async (req, res, next) => {
        try {
            const {allow} = req.body;

            const paymentTypes = await PaymentTypes.findAll();

            if(_.isEmpty(paymentTypes)){
                throw HttpError(403, "Не нашел тип оплаты");
            }

            await PaymentTypes.update({
                allowUse: allow ? 't' : 'f',
            }, {where: {}});

            const payments = await PaymentTypes.findAll();

            res.json({
                status: "ok",
                payments,
            });
        } catch (e) {
            next(e);
        }
    }
}
