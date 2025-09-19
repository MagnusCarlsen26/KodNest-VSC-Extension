import 'dotenv/config';

const someId = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d"; // Could be some sort of userId but don't know

export async function getModuleId() {
    const response = await fetch(`https://api.kodnest.in/assessment-service/api/v2/consumers/practices/all/${someId}/a86dde74-70f1-4e17-a3fd-a48502859c87`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "authorization": process.env.KODNEST_AUTHORIZATION,
        },
        "body": null,
        "method": "GET"
    });

    return await response.json();
}

function extractModuleId(data: Object) {

    return data.data.map( module => module.items.map( item => item.id ) ).flat()

}

async function main() {
    const moduleId = await getModuleId();
    console.log(extractModuleId(moduleId));
}

main();