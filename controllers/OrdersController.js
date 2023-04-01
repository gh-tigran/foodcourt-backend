import {Admin, OrderRel, Orders, Products, TempOrders, Users, Map, Basket, PaymentTypes} from "../models";
import Joi from "joi";
import HttpError from "http-errors";
import Socket from "../services/Socket";
import Validator from "../middlewares/Validator";
import _ from 'lodash';
import {joiErrorMessage} from "../services/JoiConfig";

class OrdersController {
    static getOrdersStatistics = async (req, res, next) => {
        try {
            const {productId, year} = req.query;
            const productOrders = [];

            const validate = Joi.object({
                productId: Validator.numGreatOne(true).error(new Error(joiErrorMessage.productId)),
                year: Validator.year(true).error(new Error(joiErrorMessage.year)),
            }).validate({productId, year});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            for (let i = 1; i <= 12; i++) {
                let count = 0;
                const startDate = `${year}-${i}-1`;
                const endDate = `${year}-${i}-31`;
                /*const endDate = i !== 12 ?
                    `${year}-${i + 1}-1`
                    : `${year}-${i}-30`;*/

                const tempCount = await Orders.findAll({
                    where: {
                        productId,
                        createdAt: {
                            $gt: new Date(startDate),
                            $lt: new Date(endDate),
                        }
                    }
                });

                tempCount.forEach(temp => {
                    count += temp.quantity;
                });

                productOrders.push(count);
            }

            res.json({
                status: 'ok',
                productOrders,
            });
        } catch (e) {
            next(e);
        }
    };

    static getNotReceivedOrders = async (req, res, next) => {
        try {
            const {branchId} = req.query;

            let where = branchId !== 'null' && branchId ?
                {branchId, status: {$not: 'полученный'}} :
                {status: {$not: 'полученный'}};

            const notReceivedOrders = await TempOrders.findAll({
                where,
                include: [{
                    model: Orders,
                    as: 'orders',
                    required: true,
                    include: [{
                        model: Products,
                        as: 'product',
                        required: true,
                    }]
                }, {
                    model: Users,
                    as: 'user',
                    required: true,
                }, {
                    model: PaymentTypes,
                    as: 'paymentType',
                    required: true,
                }],
            });

            res.json({
                status: 'ok',
                notReceivedOrders,
            });
        } catch (e) {
            next(e);
        }
    };

    static getSingleNotReceivedOrder = async (req, res, next) => {
        try {
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
            }).validate({id});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const singleNotReceivedOrder = await TempOrders.findOne({
                where: {id},
                include: [{
                    model: Orders,
                    as: 'orders',
                    required: true,
                    include: [{
                        model: Products,
                        as: 'product',
                        required: true,
                    }]
                }, {
                    model: Users,
                    as: 'user',
                    required: true,
                }, {
                    model: PaymentTypes,
                    as: 'paymentType',
                    required: true,
                }],
            });

            res.json({
                status: 'ok',
                singleNotReceivedOrder,
            });
        } catch (e) {
            next(e);
        }
    };

    static getUserNotReceivedOrders = async (req, res, next) => {
        try {
            const {userId} = req;

            const userNotReceivedOrders = await TempOrders.findAll({
                where: {
                    userId,
                    status: {$not: 'полученный'}
                },
                include: [{
                    model: Orders,
                    as: 'orders',
                    required: true,
                    include: [{
                        model: Products,
                        as: 'product',
                        required: true,
                    }, {
                        model: PaymentTypes,
                        as: 'paymentType',
                        required: true,
                    }]
                }],
            })

            res.json({
                status: 'ok',
                userNotReceivedOrders,
            });
        } catch (e) {
            next(e);
        }
    };

    static addOrder = async (req, res, next) => {
        try {
            let {branchId, paymentTypeId, message, productsList} = req.body;
            let {address} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                branchId: Validator.numGreatOne(true).error(new Error(joiErrorMessage.branchId)),
                paymentTypeId: Validator.numGreatOne(true).error(new Error(joiErrorMessage.paymentTypeId)),
                message: Validator.longText(false).error(new Error(joiErrorMessage.message)),
                address: Validator.shortText(paymentTypeId === '1').error(new Error(joiErrorMessage.address)),
                productsList: Validator.productList(true).error(new Error(joiErrorMessage.productsList)),
            }).validate({branchId, paymentTypeId, message, address, productsList});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const branch = await Map.findOne({where: {id: branchId}});

            if(_.isEmpty(branch)){
                throw HttpError(422);
            }

            if (paymentTypeId === '1' && !address) {
                throw HttpError(422);
            } else if(paymentTypeId !== '1') {
                address = undefined;
            }

            const newOrders = await Orders.bulkCreate(productsList);
            const orderIds = newOrders.map(order => order.id);

            let newTempOrder = await TempOrders.create({
                userId,
                branchId,
                paymentTypeId,
                address,
                message,
                status: 'в ожидании',
            });

            const orderRel = orderIds.map(id => {
                return {
                    orderId: id,
                    tempOrderId: newTempOrder.id
                }
            });

            await OrderRel.bulkCreate(orderRel);
            const admin = await Admin.findAll({
                where: {
                    $or: [
                        {branchId},
                        {branchId: null},
                    ]
                }
            });

            const adminIds = admin.map(a => a.id);

            newTempOrder = await TempOrders.findOne({
                where: {
                    id: newTempOrder.id
                },
                include: [{
                    model: Orders,
                    as: 'orders',
                    required: true,
                    include: [{
                        model: Products,
                        as: 'product',
                        required: true,
                    }]
                }, {
                    model: Users,
                    as: 'user',
                    required: true,
                }, {
                    model: PaymentTypes,
                    as: 'paymentType',
                    required: true,
                }],
            });

            Socket.emitAdmin(adminIds, 'new-order', {order: newTempOrder});

            await Basket.destroy({
                where: {userId}
            })

            res.json({
                status: 'ok',
                newTempOrder
            });
        } catch (e) {
            next(e);
        }
    };

    // static addOrderByCard = async (req, res, next) => {
    //     try {
    //         let {paymentMethodId, amount, branchId, receiveType, message, productsList} = req.body;
    //         let {address} = req.body;
    //         const {userId} = req;
    //         let charge;
    //
    //         const validate = Joi.object({
    //             branchId: Validator.numGreatOne(true),
    //             paymentMethodId: Validator.shortText(true),
    //             amount: Validator.numGreatOne(true),
    //             receiveType: Joi.string().valid('cardOnBranch', 'cardOnDelivery'),
    //             message: Validator.longText(false),
    //             address: Validator.shortText(true),
    //             //productsList: Validator.productList(true),
    //         }).validate({branchId, paymentMethodId, amount, receiveType, message, address, /*productsList*/});
    //
    //         if (validate.error) {
    //             throw HttpError(422, validate.error);
    //         }
    //
    //         if (receiveType === 'cardOnDelivery' && !address) {
    //             throw HttpError(422);
    //         } else if(receiveType !== 'cardOnDelivery') {
    //             address = undefined;
    //         }
    //
    //         const customer = await checkCustomer(userId);
    //
    //         if (!customer) {
    //             throw HttpError(422);
    //         }
    //
    //         const branch = await Map.findOne({where: {id: branchId}});
    //
    //         if(_.isEmpty(branch)){
    //             throw HttpError(422);
    //         }
    //         //----todo front sarqeluc heto es masy jnjel
    //         productsList = [{
    //             id: 77,
    //             quantity: 5
    //         }, {
    //             id: 78,
    //             quantity: 6,
    //         }];
    //
    //         try {
    //             charge = await paymentController.paymentIntents
    //                 .create({
    //                     amount: +amount * 100,
    //                     currency: 'usd',
    //                     payment_method_types: ['card'],
    //                     off_session: true,
    //                     confirm: true,
    //                     customer: `${customer.id}`,
    //                     payment_method: paymentMethodId,
    //                 })
    //                 .then((d) => ({
    //                     ...d,
    //                     error: null,
    //                     status: 'ok',
    //                 }))
    //                 .catch((e) => ({
    //                     error: e.message,
    //                     id: null,
    //                     status: 'error',
    //                 }));
    //         } catch (e) {
    //             throw HttpError(422, e.message);
    //         }
    //
    //         if (charge.status === 'ok' && !charge.error) {
    //             //add order product
    //             const ordersList = productsList.map((product) => {
    //                 return {
    //                     productId: product.id,
    //                     quantity: product.quantity,
    //                 }
    //             });
    //
    //             const newOrders = await Orders.bulkCreate(ordersList);
    //             const orderIds = newOrders.map(order => order.id);
    //
    //             let newTempOrder = await TempOrders.create({
    //                 userId,
    //                 branchId,
    //                 receiveType,
    //                 message,
    //                 address,
    //                 status: 'в ожидании',
    //             });
    //
    //             const orderRel = orderIds.map(id => {
    //                 return {
    //                     orderId: id,
    //                     tempOrderId: newTempOrder.id
    //                 }
    //             });
    //
    //             await OrderRel.bulkCreate(orderRel);
    //             const admin = await Admin.findAll({
    //                 where: {
    //                     $or: [
    //                         {branchId},
    //                         {branchId: null},
    //                     ]
    //                 }
    //             });
    //             const adminIds = admin.map(a => a.id);
    //
    //             newTempOrder = await TempOrders.findOne({
    //                 where: {
    //                     id: newTempOrder.id
    //                 },
    //                 include: [{
    //                     model: Orders,
    //                     as: 'orders',
    //                     required: true,
    //                     include: [{
    //                         model: Products,
    //                         as: 'product',
    //                         required: true,
    //                     }]
    //                 }, {
    //                     model: Users,
    //                     as: 'user',
    //                     required: true,
    //                 }],
    //             });
    //
    //             Socket.emitAdmin(adminIds, 'new-order', {order: newTempOrder});
    //
    //             await Basket.destroy({
    //                 where: {userId}
    //             })
    //         }
    //
    //         res.json({
    //             charge: {confirmationId: charge.id, message: charge.error || null},
    //             message: charge.error || 'success charged',
    //             status: charge.status,
    //         });
    //     } catch (e) {
    //         next(e);
    //     }
    // };

    static modifyOrder = async (req, res, next) => {
        try {
            const {status} = req.body;
            const {id} = req.params;

            const validate = Joi.object({
                id: Validator.numGreatOne(true).error(new Error(joiErrorMessage.id)),
                status: Joi.string().valid('в процессе', 'готовый', 'в пути', 'полученный').required().error(new Error(joiErrorMessage.status)),
            }).validate({id, status});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            let modifiedOrder;

            if (status === 'полученный') {
                modifiedOrder = await TempOrders.destroy({
                    where: {id}
                });
            } else {
                modifiedOrder = await TempOrders.update({
                    status
                }, {where: {id}})
            }

            res.json({
                status: 'ok',
                modifiedOrder
            });
        } catch (e) {
            next(e);
        }
    };
}

export default OrdersController
