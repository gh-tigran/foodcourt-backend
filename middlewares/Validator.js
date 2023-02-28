import Joi from "joi";

export default class Validator {
    static email = (required) => {
        return required ?
            Joi.string().email().required()
            : Joi.string().email();
    }
    static password = (required) => {
        // return required ?
        //     Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/).required()
        //     : Joi.string().regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,}$/);
        return Joi.string().min(5);
    }
    static phone = (required) => {
        return required ?
            Joi.string().regex(/^\d{11,20}$/).required()
            : Joi.string().regex(/^\d{11,20}$/);
    }
    static role = (required) => {
        return required ?
            Joi.string().valid('admin', 'admin manager', 'manager').required()
            : Joi.string().valid('admin', 'admin manager', 'manager');
    }
    static token = (required) => {
        return required ?
            Joi.string().min(10).required()
            : Joi.string().min(10);
    }
    static numGreatOne = (required) => {
        return required ?
            Joi.number().min(1).required()
            : Joi.number().min(1);
    }
    static shortText = (required) => {
        return required ?
            Joi.string().min(1).max(80).required()
            : Joi.string().min(1).max(80);
    }
    static longText = (required) => {
        return required ?
            Joi.string().min(1).max(3000).required()
            : Joi.string().min(1).max(3000);
    }
    static idArray = (required) => {
        return required ?
            Joi.array().items(Joi.number().min(1)).required()
            : Joi.array().items(Joi.number().min(1));
    }
    static year = (required) => {
        return required ?
            Joi.string().regex(/^\d{4}$/).required()
            : Joi.string().regex(/^\d{4}$/);
    }
    static cardNumber = (required) => {
        return required ?
            Joi.string().regex(/^\d{16}$/).required()
            : Joi.string().regex(/^\d{16}$/);
    }
    static cvc = (required) => {
        return required ?
            Joi.string().regex(/^\d{3}$/).required()
            : Joi.string().regex(/^\d{3}$/);
    }
    static month = (required) => {
        return required ?
            Joi.string().regex(/^\d{1,2}$/).required()
            : Joi.string().regex(/^\d{1,2}$/);
    }
    static productList = (required) => {
        return required ?
            Joi.array().items(Joi.object({
                productId: Joi.number().min(1).required(),
                quantity: Joi.number().min(1).required(),
            })).required()
            : Joi.array().items(Joi.object({
                productId: Joi.number().min(1).required(),
                quantity: Joi.number().min(1).required(),
            }));
    }
}
