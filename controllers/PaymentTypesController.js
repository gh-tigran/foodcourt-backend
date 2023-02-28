import {PaymentTypes} from "../models";
import Joi from "joi";
import Validator from "../middlewares/Validator";
import HttpError from "http-errors";
import _ from 'lodash';

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

    static getSinglePaymentTypes = async (req, res, next) => {
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
            const {type, typeName} = req.body;

            const validate = Joi.object({
                type: Validator.shortText(true),
                typeName: Validator.shortText(true),
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
                throw HttpError(403, 'This payment type already exist.');
            }

            const addedPaymentType = await PaymentTypes.create({
                type,
                typeName
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
            const {type, typeName} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
                type: Validator.shortText(false),
                typeName: Validator.shortText(false),
            }).validate({id, type, typeName});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const paymentType = await PaymentTypes.findOne({
                where: { id }
            });

            if(_.isEmpty(paymentType)){
                throw HttpError(403, "Don't find payment type from this id.");
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
                throw HttpError(403, 'This payment type already exist.');
            }

            const updatedPaymentType = await PaymentTypes.update({
                type,
                typeName
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
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const paymentType = await PaymentTypes.findOne({
                where: { id }
            });

            if(_.isEmpty(paymentType)){
                throw HttpError(403, "Don't find payment type from this id.");
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
}
