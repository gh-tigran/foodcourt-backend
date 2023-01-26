import _ from 'lodash';
import Stripe from 'stripe';
import {Users} from "../models";
import HttpError from "http-errors";
import Joi from "joi";
import Validator from "../middlewares/Validator";

const {STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY} = process.env;
export const paymentController = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2022-08-01',
});

export async function checkCustomer(id) {
    let customer = await paymentController.customers.search({
        query: `metadata[\"userId\"]:\"${id}\"`,
    }).then((d) => d)
        .catch(() => null);

    if (customer === null || _.isEmpty(customer.data)) customer = null;

    return _.get(customer, 'data.0') || null;
}

export default {
    getStripePublicKey(req, res, next) {
        try {
            res.json({
                status: 'ok',
                message: 'Stripe key',
                publicKey: STRIPE_PUBLIC_KEY,
            });
        } catch (e) {
            next(e);
        }
    },

    async setupStripeIntent(req, res, next) {
        try {
            const {userId} = req;
            let customer = await checkCustomer(userId);

            if (_.isEmpty(customer)) {
                const profile = await Users.findOne({where: {id: userId}});

                customer = await paymentController.customers.create({
                    name: `${profile.firstName} ${profile.lastName}`,
                    phone: profile.phoneNum ? `${profile.phoneNum}` : '',
                    email: profile.email ? `${profile.email}` : '',
                    metadata: {userId: `${userId}`},
                }).then((d) => d)
                    .catch(() => null);
            }

            const setupIntent = await paymentController.setupIntents.create({
                payment_method_types: ['card'],
            }).then((d) => d)
                .catch(() => null);

            res.json({
                status: 'ok',
                message: 'strip intent',
                customerId: customer.id,
                intent: setupIntent.client_secret,
            });
        } catch (e) {
            next(e);
        }
    },

    async stripeCreateCard(req, res, next) {
        try {
            const {number, exp_month, exp_year, cvc} = req.body;
            let paymentMethod;

            const validate = Joi.object({
                number: Validator.cardNumber(true),
                exp_month: Validator.month(true),
                exp_year: Validator.year(true),
                cvc: Validator.cvc(true),
            }).validate({number, exp_month, exp_year, cvc});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            try {
                paymentMethod = await paymentController.paymentMethods.create({
                    type: 'card',
                    card: {
                        number,
                        exp_month,
                        exp_year,
                        cvc,
                    },
                });
            } catch (e) {
                throw HttpError(422, e.message);
            }

            res.json({
                status: 'ok',
                message: 'attached',
                paymentMethod
            });
        } catch (e) {
            next(e);
        }
    },

    async stripeAttach(req, res, next) {
        try {
            const {paymentMethodId} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                paymentMethodId: Validator.shortText(true),
            }).validate({paymentMethodId});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const customer = await checkCustomer(userId);

            if (!customer) {
                throw HttpError(422);
            }

            const pm = await paymentController.paymentMethods.retrieve(paymentMethodId).then((t) => t).catch(() => null);

            if (!pm) {
                throw HttpError(422);
            }

            const {data: cards} = await paymentController.customers.listPaymentMethods(customer.id, {
                type: 'card',
                limit: 100,
            }).then((d) => d)
                .catch(() => []);

            if (cards.find(({card: {fingerprint}}) => fingerprint === pm.card.fingerprint)) {
                //todo stex cardi attach exnelu depqum jnjegy
                //await paymentController.paymentMethods.detach(pm.id).then((d) => d).catch(() => null);

                //res.json({
                //    status: 'error',
                //    message: 'paymentMethodId already attached',
                //});
                //return;
                throw HttpError(422, 'Payment Method already attached');
            }

            try {
                await paymentController.paymentMethods.attach(paymentMethodId, {customer: customer.id});
            } catch (e) {
                throw HttpError(422, e.message);
            }

            res.json({
                status: 'ok',
                message: 'attached',
            });
        } catch (e) {
            next(e);
        }
    },

    /*async stripeCreateAttachCard(req, res, next) {
        try {
            if (_.isEmpty(req)) {
                throw HttpError(403);
            }

            const {userId} = req.body;
            const {number, exp_month, exp_year, cvc} = req.body;

            const validate = Joi.object({
                number: Joi.string().regex(/^\d{16}$/).required(),
                exp_month: Joi.string().regex(/^\d{1,2}$/).required(),
                exp_year: Joi.string().regex(/^\d{4}$/).required(),
                cvc: Joi.string().regex(/^\d{3}$/).required(),
            }).validate({number, exp_month, exp_year, cvc});

            if (validate.error) {
                throw HttpError(403, validate.error);
            }

            const paymentMethod = await paymentController.paymentMethods.create({
                type: 'card',
                card: {
                    number,
                    exp_month,
                    exp_year,
                    cvc,
                },
            });

            const customer = await checkCustomer(userId);

            if (!customer) {
                throw HttpError(403);
            }

            const pm = await paymentController.paymentMethods.retrieve(paymentMethod.id).then((t) => t).catch(() => null);

            if (!pm) {
                throw HttpError(403);
            }

            const {data: cards} = await paymentController.customers.listPaymentMethods(customer.id, {
                type: 'card',
                limit: 100,
            }).then((d) => d)
                .catch(() => []);

            if (cards.find(({card: {fingerprint}}) => fingerprint === pm.card.fingerprint)) {
                await paymentController.paymentMethods.detach(pm.id).then((d) => d).catch(() => null);

                res.json({
                    status: 'error',
                    message: 'paymentMethodId already attached',
                });
                return;
            }

            await paymentController.paymentMethods.attach(paymentMethod.id, {customer: customer.id});

            res.json({
                status: 'ok',
                message: 'attached',
            });
        } catch (e) {
            next(e);
        }
    },*/

    async stripeCharge(req, res, next) {
        try {
            const {paymentMethodId, amount} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                paymentMethodId: Validator.shortText(true),
                amount: Validator.numGreatOne(true),
            }).validate({paymentMethodId, amount});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const customer = await checkCustomer(userId);
            let charge;

            if (!customer) {
                throw HttpError(422);
            }

            try {
                charge = await paymentController.paymentIntents
                    .create({
                        amount: +amount * 100,
                        currency: 'usd',
                        payment_method_types: ['card'],
                        off_session: true,
                        confirm: true,
                        customer: `${customer.id}`,
                        payment_method: paymentMethodId,
                    })
                    .then((d) => ({
                        ...d,
                        error: null,
                        status: 'ok',
                    }))
                    .catch((e) => ({
                        error: e.message,
                        id: null,
                        status: 'error',
                    }));
            } catch (e) {
                throw HttpError(422, e.message);
            }

            res.json({
                charge: {confirmationId: charge.id, message: charge.error || null},
                message: charge.error || 'success charged',
                status: charge.status,
            });
        } catch (e) {
            next(e);
        }
    },

    async stripeCardList(req, res, next) {
        try {
            const {userId} = req;
            const customer = await checkCustomer(userId);

            if (!customer) {
                throw HttpError(422);
            }

            const {data: cards} = await paymentController.customers.listPaymentMethods(customer.id, {
                type: 'card',
                limit: 100,
            }).then((d) => d)
                .catch(() => null);

            res.json({
                cards,
                message: 'card list',
                status: 'ok',
            });
        } catch (e) {
            next(e);
        }
    },

    async stripeCardSingle(req, res, next) {
        try {
            const {paymentMethodId} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                paymentMethodId: Validator.shortText(true),
            }).validate({paymentMethodId});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const customer = await checkCustomer(userId);

            if (!customer) {
                throw HttpError(422);
            }

            const card = await paymentController.paymentMethods.retrieve(paymentMethodId)
                .then((d) => d)
                .catch(() => null);

            res.json({
                card,
                message: 'card single',
                status: 'ok',
            });
        } catch (e) {
            next(e);
        }
    },

    async deleteStripeCard(req, res, next) {
        try {
            const {paymentMethodId} = req.body;
            const {userId} = req;

            const validate = Joi.object({
                paymentMethodId: Validator.shortText(true),
            }).validate({paymentMethodId});

            if (validate.error) {
                throw HttpError(422, validate.error);
            }

            const customer = await checkCustomer(userId);

            if (!customer) {
                throw HttpError(422);
            }

            const deleted = await paymentController.paymentMethods.detach(paymentMethodId).then(() => true).catch(() => false);

            res.json({
                deleted,
                message: 'deleted',
                status: 'ok',
            });
        } catch (e) {
            next(e);
        }
    },

    async deleteStripeCustomer(req, res, next) {
        try {
            const {userId} = req;
            const customer = await checkCustomer(userId);

            if (!customer) {
                throw HttpError(422);
            }

            const deletedCustomer = await paymentController.customers
                .del(`${customer.id}`)
                .then((d) => d)
                .catch((e) => ({
                    id: customer.id,
                    object: e.message,
                    deleted: false,
                }));

            res.json({
                deletedCustomer,
                message: 'customer deleted',
                status: 'ok',
            });
        } catch (e) {
            next(e);
        }
    },
};
