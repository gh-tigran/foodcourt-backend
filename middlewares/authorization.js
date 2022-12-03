import jwt from "jsonwebtoken";
import HttpError from "http-errors";

const {JWT_SECRET} = process.env;

const reg1 = /^\/users\/modify-account.*$/;
const reg2 = /^\/users\/delete-account.*$/;
const reg3 = /^\/users\/list.*$/;
const reg4 = /^\/users\/single\/.*$/;

const INCLUDE = [
    reg1,
    reg2,
    reg3,
    reg4,
];

export default function authorization(req, res, next) {
    try {
        const {path, method} = req;
        let isAllowForUser = true;

        INCLUDE.forEach(regexp => {
            if(regexp.test(path)){
                isAllowForUser = false;
            }
        });

        if (isAllowForUser) {
            next();
            return;
        }

        const token = req.headers.authorization || req.query.token || '';
        let userId;

        try {
            const data = jwt.verify(token.replace('Bearer ', ''), JWT_SECRET);

            userId = data.userId;
        } catch (e) {

        }

        if (!userId) {
            throw HttpError(401, 'Invalid token, authorization',)
        }

        req.userId = userId;
        next();
    } catch (e) {
        next(e);
    }
}

