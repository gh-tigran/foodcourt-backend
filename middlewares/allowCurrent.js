import HttpError from "http-errors";

const notAllowOwner = [
    'paymentSetupIntent',
    'paymentCreateCard',
    'paymentAttach',
    'paymentCharge',
    'paymentCardList',
    'paymentCardSingle',
    'paymentDeleteCard',
    'paymentDeleteCustomer',

    'getBasket',
    'addToBasket',
    'updateBasketItem',
    'removeFromBasket',

    'userCurrent',
    'userModifyCurrent',
    'userDeleteCurrent',

    'orderAdd',
    'ordersListUser',
];

const notAllowSuperAdmin = [
    'paymentSetupIntent',
    'paymentCreateCard',
    'paymentAttach',
    'paymentCharge',
    'paymentCardList',
    'paymentCardSingle',
    'paymentDeleteCard',
    'paymentDeleteCustomer',

    'userCurrent',
    'userDeleteCurrent',
    'userModifyCurrent',
    'userChangeStatus',
    'userSingle',
    'usersList',

    'adminRegister',
    'adminsList',
    'adminSingle',
    'adminDelete',
    'adminModify',

    'getBasket',
    'addToBasket',
    'updateBasketItem',
    'removeFromBasket',

    'orderAdd',
    'ordersListUser',

    'getPaymentTypes',
    'getAllowedPaymentTypes',
    'getSinglePaymentType',
    'addPaymentType',
    'updatePaymentType',
    'deletePaymentType',
    'allowPay',
];

const allowAdmin = [
    'adminGetCurrent',
    'adminModifyCurrent',
    'adminDeleteCurrent',

    'ordersList',
    'ordersStatistics',
    'orderModify',
    'singleOrder',
];

const allowUser = [
    'paymentSetupIntent',
    'paymentCreateCard',
    'paymentAttach',
    'paymentCharge',
    'paymentCardList',
    'paymentCardSingle',
    'paymentDeleteCard',
    'paymentDeleteCustomer',

    'getBasket',
    'addToBasket',
    'updateBasketItem',
    'removeFromBasket',

    'userCurrent',
    'userModifyCurrent',
    'userDeleteCurrent',

    'orderAdd',
    'ordersListUser',

    'getAllowedPaymentTypes',

    'userChangeEmail',
];

const allowCurrent = (permission) => async (req, res, next)=> {
    try{
        const {userId, adminId, adminRole} = req;

        if(adminId
            && adminRole === 'владелец'
            && !notAllowOwner.includes(permission)){
            next();
            return;
        }else if(adminId
            && adminRole === 'супер админ'
            && !notAllowSuperAdmin.includes(permission)){
            next();
            return;
        }else if(adminId
            && adminRole === 'админ'
            && allowAdmin.includes(permission)){
            next();
            return;
        }

        if(userId && allowUser.includes(permission)){
            next();
            return;
        }

        throw HttpError(401);
    }catch (e) {
        next(e);
    }
}

export default allowCurrent;
