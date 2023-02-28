import HttpError from "http-errors";

const notAllowAdmin = [
    'paymentSetupIntent', 'paymentCreateCard', 'paymentAttach', 'paymentCharge', 'paymentCardList', 'paymentCardSingle', 'paymentDeleteCard', 'paymentDeleteCustomer',
    'getBasket', 'addToBasket', 'updateBasketItem', 'removeFromBasket',
    'userCurrent', 'userModifyCurrent', 'userDeleteCurrent',
    'orderAdd', 'ordersListUser',
];

const notAllowAdminManager = [
    'paymentSetupIntent', 'paymentCreateCard', 'paymentAttach', 'paymentCharge', 'paymentCardList', 'paymentCardSingle', 'paymentDeleteCard', 'paymentDeleteCustomer',
    'userCurrent', 'userDeleteCurrent', 'userModifyCurrent', 'userChangeStatus', 'userSingle', 'usersList',
    'adminRegister', 'adminsList', 'adminSingle', 'adminDelete', 'adminModify',
    'getBasket', 'addToBasket', 'updateBasketItem', 'removeFromBasket',
    'orderAdd', 'ordersListUser',
];

const allowManager = [
    'adminGetCurrent', 'adminModifyCurrent', 'adminDeleteCurrent',
    'ordersList', 'ordersStatistics', 'orderModify', 'singleOrder',
];

const allowUser = [
    'paymentSetupIntent', 'paymentCreateCard', 'paymentAttach', 'paymentCharge', 'paymentCardList', 'paymentCardSingle', 'paymentDeleteCard', 'paymentDeleteCustomer',
    'getBasket', 'addToBasket', 'updateBasketItem', 'removeFromBasket',
    'userCurrent', 'userModifyCurrent', 'userDeleteCurrent',
    'orderAdd', 'ordersListUser',
];

const allowCurrent = (permission) => async (req, res, next)=> {
    try{
        const {userId, adminId, adminRole} = req;

        if(adminId
            && adminRole === 'admin'
            && !notAllowAdmin.includes(permission)){
            next();
            return;
        }else if(adminId
            && adminRole === 'admin manager'
            && !notAllowAdminManager.includes(permission)){
            next();
            return;
        }else if(adminId
            && adminRole === 'manager'
            && allowManager.includes(permission)){
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
