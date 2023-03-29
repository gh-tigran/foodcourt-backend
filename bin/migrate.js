import {
    Admin,
    Users,
    Categories,
    Products,
    Basket,
    Slides,
    Map,
    MapImages,
    ProdCatRel,
    TempOrders,
    Orders,
    OrderRel,
    PaymentTypes,
    Footer,
    FooterSocial,
    Comment,
    About,
} from "../models";

const {ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_LAST_NAME, ADMIN_PHONE_NUM} = process.env;

async function main() {
    for (const Model of [
        Admin,
        Users,
        Categories,
        Products,
        Basket,
        Slides,
        Map,
        MapImages,
        ProdCatRel,
        TempOrders,
        Orders,
        OrderRel,
        PaymentTypes,
        Footer,
        FooterSocial,
        Comment,
        About,
    ]) {
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
            role: 'владелец',
            status: 'active',
        });
    }
    process.exit();
}

main();
