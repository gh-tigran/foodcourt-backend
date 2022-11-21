import {Slides} from "../models";

async function main() {
    for (const Model of [Slides]) {
        console.log(Model);

        await Model.sync({alter: true});
    }

    process.exit();
}
main();
