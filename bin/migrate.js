import {Slides, Offers, Categories} from "../models";

async function main() {
    for (const Model of [Slides, Offers, Categories]) {
        console.log(Model);

        await Model.sync({alter: true});
    }

    process.exit();
}
main();
