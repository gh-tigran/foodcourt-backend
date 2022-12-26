import HttpError from "http-errors";

const notAllowAdminSenior = [
    'getBasket', 'addToBasket', 'updateBasketItem', 'removeFromBasket',
    'userCurrent', 'userModifyCurrent', 'userDeleteCurrent',
];
const notAllowAdminMiddle = [
    'userCurrent', 'userDeleteCurrent', 'userModifyCurrent', 'userDelete', 'userSingle', 'usersList',
    'adminRegister', 'adminsList', 'adminSingle', 'adminDelete', 'adminModify',
    'getBasket', 'addToBasket', 'updateBasketItem', 'removeFromBasket',
];
const allowAdminJunior = [
    'adminGetCurrent', 'adminModifyCurrent', 'adminDeleteCurrent'
];
const allowUser = [
    'userCurrent', 'userModifyCurrent', 'userDeleteCurrent',
    'getBasket', 'addToBasket', 'updateBasketItem', 'removeFromBasket',
];

const allowCurrent = (permission) => async (req, res, next)=> {
    try{
        const {userId, adminId, adminPossibility} = req;

        if(adminId
            && adminPossibility === 'senior'
            && !notAllowAdminSenior.includes(permission)){
            next();
            return;
        }else if(adminId
            && adminPossibility === 'middle'
            && !notAllowAdminMiddle.includes(permission)){
            next();
            return;
        }else if(adminId
            && adminPossibility === 'junior'
            && allowAdminJunior.includes(permission)){
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
