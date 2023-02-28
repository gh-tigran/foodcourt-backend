import {Basket, Products} from "../models";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";
import Validator from "../middlewares/Validator";

export default class BasketController {
    static getBasket = async (req, res, next) => {
        try {
            const {userId} = req;

            let basket = await Basket.findAll({
                where: {userId},
                include: [{
                    model: Products,
                    as: 'product',
                    required: true,
                }]
            });

            res.json({
                status: "ok",
                basket: basket || [],
            });
        } catch (e) {
            next(e);
        }
    }

    static addToBasket = async (req, res, next) => {
        try {
            let {productId, quantity} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                productId: Validator.numGreatOne(true),
                quantity: Validator.numGreatOne(true),
            }).validate({productId, quantity});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const product = await Products.findOne({
                where: {id: productId}
            });

            if (_.isEmpty(product)) {
                throw HttpError(403, 'Invalid product id.');
            }

            const basket = await Basket.findOne({where: {productId, userId}});

            if (!_.isEmpty(basket)) {
                quantity = +basket.quantity + +quantity;

                const basketItem = Basket.update({
                    quantity
                }, {where: {id: basket.id}})

                res.json({
                    status: "ok",
                    basketItem,
                });
                return;
            }

            const basketItem = await Basket.create({
                userId,
                productId,
                quantity
            });

            res.json({
                status: "ok",
                basketItem
            });
        } catch (e) {
            next(e);
        }
    }

    static updateBasketItem = async (req, res, next) => {
        try {
            const {quantity} = req.body;
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
                quantity: Validator.numGreatOne(true),
            }).validate({id, quantity});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const basketItem = await Basket.findOne({
                where: {id},
                include: [{
                    model: Products,
                    as: 'product',
                    required: true,
                }]
            });

            if (_.isEmpty(basketItem)) {
                throw HttpError(403, 'Invalid id.');
            }

            const updatedItem = Basket.update({
                quantity
            }, {where: {id}})

            res.json({
                status: "ok",
                updatedItem
            })
        } catch (e) {
            next(e);
        }
    }

    static removeFromBasket = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            await Basket.destroy({
                where: {id}
            })

            res.json({
                status: "ok",
                removedItemId: id
            });
        } catch (e) {
            next(e);
        }
    }
}
