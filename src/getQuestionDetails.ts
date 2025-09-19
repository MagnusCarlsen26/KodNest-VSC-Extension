import 'dotenv/config';


const moduleId: string = "7604eebf-7c9d-44ce-814d-c2ab6c79ffc3";
const questionId: string = "3fdf77f2-e748-4c4a-9e5f-b7017a94c324";
const sectionId: string = "bc008f90-0e48-4f01-8ce3-4d7f5ef19b28"; // Actually PageId but they call it section

const someId: string = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d"; // Could be some sort of userId but don't know

export async function getQuestionDetails(): Promise<any> {

    const response = await fetch(`https://api.kodnest.in/assessment-service/api/v2/consumers/practices/${moduleId}/${someId}/${sectionId}/${questionId}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "authorization": process.env.KODNEST_AUTHORIZATION,
        },
        "body": null,
        "method": "GET"
    });

    return await response.json();

}