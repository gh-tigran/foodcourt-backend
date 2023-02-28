import jwt from "jsonwebtoken";
import HttpError from "http-errors";
import {Admin, Users} from "../models";
import _ from 'lodash';

const {JWT_SECRET} = process.env;

const EXCLUDE = [
    '/users/change-pass',
    '/users/forget-pass',
    '/users/register',
    '/users/confirm',
    '/users/login',

    '/admin/forget-pass',
    '/admin/change-pass',
    '/admin/confirm',
    '/admin/login',

    '/categories/get',
    '/products/get',
    '/offers/get',
    '/slides/get',
    '/news/get',
    '/map/get',

    '/payment/public-key'
];

export default async function authorization(req, res, next) {
    try {
        const {path, method} = req;
        const token = req.headers.authorization || req.query.token || '';
        let userId, adminId;

        if (method === 'OPTIONS' || EXCLUDE.some((d) => path.replace(/\?.*/, '').startsWith(d))) {
            next();
            return;
        }

        try {
            const data = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);

            userId = data.userId;
            adminId = data.adminId;
        } catch (e) {
        }

        if (userId) {
            const user = await Users.findOne({where: {id: userId, status: 'active'}});

            if (_.isEmpty(user)) {
                throw HttpError(401);
            }

            req.userId = userId;
            next();
            return;
        }

        if (adminId) {
            const admin = await Admin.findOne({where: {id: adminId, status: 'active'}});

            if (_.isEmpty(admin)) {
                throw HttpError(401);
            }

            req.adminId = adminId;
            req.adminRole = admin.role;
            next();
            return;
        }

        if (!userId && !adminId) throw HttpError(401);

        next();
    } catch (e) {
        next(e);
    }
}
