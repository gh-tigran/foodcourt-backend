import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import _ from 'lodash';

const {JWT_SECRET} = process.env;

const includeForDefault = [
    {path: /^\/users\/register\/?$/, method: 'POST'},
    {path: /^\/users\/confirm.*$/, method: 'GET'},
    {path: /^\/users\/login\/?$/, method: 'POST'},
    {path: /^\/admin\/login\/?$/, method: 'POST'},
    {path: /^\/slides(\/.*)?$/, method: 'GET'},
    {path: /^\/products(\/.*)?$/, method: 'GET'},
    {path: /^\/offers(\/.*)?$/, method: 'GET'},
    {path: /^\/news(\/.*)?$/, method: 'GET'},
    {path: /^\/map(\/.*)?$/, method: 'GET'},
    {path: /^\/categories(\/.*)?$/, method: 'GET'},
];

const includeForUser = [
    {path: /^\/users\/register\/?$/, method: 'POST'},
    {path: /^\/users\/login\/?$/, method: 'POST'},
    {path: /^\/users(\/.*)?$/, method: 'PUT'},
    {path: /^\/users(\/.*)?$/, method: 'DELETE'},
    {path: /^\/users\/[0-9]+$/, method: 'GET'},
    {path: /^\/users\/confirm\/?$/, method: 'GET'},
    {path: /^\/slides(\/.*)?$/, method: 'GET'},
    {path: /^\/products(\/.*)?$/, method: 'GET'},
    {path: /^\/offers(\/.*)?$/, method: 'GET'},
    {path: /^\/news(\/.*)?$/, method: 'GET'},
    {path: /^\/map(\/.*)?$/, method: 'GET'},
    {path: /^\/categories(\/.*)?$/, method: 'GET'},
];

const excludeForAdmin = [
    {path: /^\/users(\/.*)?$/, method: 'PUT'},
    {path: /^\/users(\/.*)?$/, method: 'DELETE'},
];

export default function authorization(req, res, next) {
    try {
        const {path, method} = req;
        const token = req.headers.authorization || req.query.token || '';
        let userId;
        let adminId;

        try {
            const data = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);

            userId = data.userId;
            adminId = data.adminId;
        } catch (e) {}

        if (userId) {
            // let allowedPathForUser = includeForUser.find((reg) => {
            //     return reg.path.test(path) && method === reg.method;
            // });
            //
            // if(_.isEmpty(allowedPathForUser)){
            //     throw HttpError(403, 'Not allowed for you');
            // }

            req.userId = userId;
            // next();
            // return;
        }

        if(adminId){
            // let notAllowedPathForAdmin = excludeForAdmin.find((reg) => {
            //     return reg.path.test(path) && method === reg.method;
            // });
            //
            // if(!_.isEmpty(notAllowedPathForAdmin)){
            //     throw HttpError(403, 'not allowed for admin');
            // }

            req.adminId = adminId;
            // next();
            // return;
        }

        // let allowedPathForDefault = includeForDefault.find((reg) => {
        //     return reg.path.test(path) && method === reg.method;
        // });
        //
        // if(_.isEmpty(allowedPathForDefault)){
        //     throw HttpError(403, 'Not allowed for you');
        // }

        next();
    } catch (e) {
        next(e);
    }
}

// import jwt from "jsonwebtoken";
// import HttpError from "http-errors";
//
// const {JWT_SECRET} = process.env;
//
// const reg1 = /^\/users\/modify-account.*$/;
// const reg2 = /^\/users\/delete-account.*$/;
// const reg3 = /^\/users\/list.*$/;
// const reg4 = /^\/users\/single\/.*$/;
//
// const INCLUDE = [
//     reg1,
//     reg2,
//     reg3,
//     reg4,
// ];
//
// export default function authorization(req, res, next) {
//     try {
//         const {path, method} = req;
//         let isAllowForUser = true;
//
//         INCLUDE.forEach(regexp => {
//             if(regexp.test(path)){
//                 isAllowForUser = false;
//             }
//         });
//
//         if (isAllowForUser) {
//             next();
//             return;
//         }
//
//         const token = req.headers.authorization || req.query.token || '';
//         let userId;
//
//         try {
//             const data = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);
//
//             userId = data.userId;
//         } catch (e) {
//
//         }
//
//         if (!userId) {
//             throw HttpError(401, 'Invalid token, authorization',)
//         }
//
//         req.userId = userId;
//         next();
//     } catch (e) {
//         next(e);
//     }
// }
//
