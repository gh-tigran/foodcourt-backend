import {Admin, Users, Categories, Products, Basket, Slides, Offers, News, Map, MapImages, ProdCatRel, /*Customers,*/ TempOrders, Orders, OrderRel} from "../models";

const {ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_LAST_NAME, ADMIN_PHONE_NUM} = process.env;

async function main() {
    for (const Model of [Admin, Users, Categories, Products, Basket, Slides, Offers, News, Map, MapImages, ProdCatRel, /*Customers,*/ TempOrders, Orders, OrderRel]) {
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
            role: 'admin',
            status: 'active',
        });
    }
    process.exit();
}

main();
