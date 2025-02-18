import {seedDefaultData} from "~/server/seeding/initialize-database";
import {db} from "~/server/db";

export async function register() {
    await seedDefaultData(db);
}