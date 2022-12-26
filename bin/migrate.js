import {Admin, Users, Basket, Slides, Offers, Categories, Products, News, Map, MapImages} from "../models";

const {ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_LAST_NAME, ADMIN_PHONE_NUM} = process.env;

async function main() {
    for (const Model of [Admin, Users, Basket, Slides, Offers, Categories, Products, News, Map, MapImages]) {
        console.log(Model);

        await Model.sync({alter: true});
    }

    const admins = await Admin.findAll({where: {status: 'active'}});

    if (!admins.length) {
        await Admin.create({
            firstName: ADMIN_NAME,
            lastName: ADMIN_LAST_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            phoneNum: ADMIN_PHONE_NUM,
            possibility: 'senior',
            status: 'active',
        });
    }
    process.exit();
}

main();
