import {Basket, Products} from "../models";
import HttpError from "http-errors";
import _ from "lodash";
import Joi from "joi";
import Validator from "../middlewares/Validator";

export default class BasketController {
    static getBasket = async (req, res, next) => {
        try {
            const {userId} = req;

            const basket = await Basket.findAll({
                where: { userId },
                include: [{
                    model: Products,
                    as: 'product',
                    required: true,
                }]
            });

            basket.totalPrice = +basket.quantity * +basket.product.price;
            basket.itemPrice = +basket.product.price;

            res.json({
                status: "ok",
                basket: basket || {},
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

            const prod = await Products.findOne({
                where: { id: productId }
            });

            if(_.isEmpty(prod)){
                throw HttpError(403, 'Invalid product id!');
            }

            const existBasket = await Basket.findOne({where: {productId}});

            if(!_.isEmpty(existBasket)){
                quantity = +existBasket.quantity + +quantity;

                const updatedItem = Basket.update({
                    quantity
                }, {where: {id: existBasket.id}})

                res.json({
                    status: "ok",
                    product: updatedItem,
                });
                return;
            }

            const addedProd = await Basket.create({
                userId,
                productId,
                quantity
            });

            res.json({
                status: "ok",
                product: addedProd
            });
        } catch (e) {
            next(e);
        }
    }

    static updateBasketItem = async (req, res, next) => {
        try {
            const {id, quantity} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
                quantity: Validator.numGreatOne(true),
            }).validate({id, quantity});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const basketProduct = await Basket.findOne({
                where: { id },
                include: [{
                    model: Products,
                    as: 'product',
                    required: true,
                }]
            });

            if(_.isEmpty(basketProduct)){
                throw HttpError(403, 'Invalid id!');
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
            const {id} = req.body;

            const validate = Joi.object({
                id: Validator.numGreatOne(true),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const removedItem = await Basket.destroy({
                where: { id }
            })

            res.json({
                status: "ok",
                removedItem
            });
        } catch (e) {
            next(e);
        }
    }
}
