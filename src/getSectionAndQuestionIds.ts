import 'dotenv/config';

const moduleId = "7604eebf-7c9d-44ce-814d-c2ab6c79ffc3";
const someId = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d";

export async function getSectionAndQuestionId(
    moduleId: string, 
    someId: string
): Promise<Object> {
    
    const response = await fetch(`https://api.kodnest.in/assessment-service/api/v2/consumers/practices/${moduleId}/${someId}/questions?page=0&page_size=100000&tab=all`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "authorization": process.env.KODNEST_AUTHORIZATION,
        },
        "body": null,
        "method": "GET"
    });

    return await response.json();
}

function extractSectionAndQuestionId(data: Object) {
    return data.data.items.map( question => question.id );
}

async function main() {
    const sectionAndQuestionId = await getSectionAndQuestionId(moduleId, someId);
    console.log(extractSectionAndQuestionId(sectionAndQuestionId));
}

main();