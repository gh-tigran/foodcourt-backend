import {Slides, Offers, Categories, Products, News} from "../models";

async function main() {
    for (const Model of [Slides, Offers, Categories, Products, News]) {
        console.log(Model);

        await Model.sync({alter: true});
    }

    process.exit();
}
main();
