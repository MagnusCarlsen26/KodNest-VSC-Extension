import 'dotenv/config';
import { writeFileSync } from 'fs';

const someId = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d";

export async function getModuleId() {
    // TODO: What is this other id?
    const response = await fetch(`https://api.kodnest.in/assessment-service/api/v2/consumers/practices/all/${someId}/a86dde74-70f1-4e17-a3fd-a48502859c87`, {
        headers: {
            "accept": "application/json, text/plain, */*",
            "authorization": process.env.KODNEST_AUTHORIZATION ?? "",
        },
        method: "GET"
    });

    return await response.json();
}

async function main() {
    const moduleIdJson = await getModuleId();
    // Save the JSON response to a file

    writeFileSync('data/moduleIdResponse.json', JSON.stringify(moduleIdJson, null, 4), 'utf-8');
    console.log('JSON response saved to data/moduleIdResponse.json');
}

main();