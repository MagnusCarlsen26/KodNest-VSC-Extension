import 'dotenv/config';


// const moduleId: string = "7604eebf-7c9d-44ce-814d-c2ab6c79ffc3";
// const questionId: string = "3fdf77f2-e748-4c4a-9e5f-b7017a94c324";
// const sectionId: string = "bc008f90-0e48-4f01-8ce3-4d7f5ef19b28"; // Actually PageId but they call it section

// const someId: string = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d"; // Could be some sort of userId but don't know

export async function getQuestionDetails(
    moduleId: string,
    someId: string,
    sectionId: string,
    questionId: string
): Promise<any> {
    const headers: Record<string, string> = {
        "accept": "application/json, text/plain, */*",
    };
    if (process.env.KODNEST_AUTHORIZATION) {
        headers["authorization"] = process.env.KODNEST_AUTHORIZATION as string;
    }

    const response = await fetch(`https://api.kodnest.in/assessment-service/api/v2/consumers/practices/${moduleId}/${someId}/${sectionId}/${questionId}`, {
        headers,
        body: null,
        method: "GET"
    });

    if (!response.ok) {
        return { data: { question: { description: "" } } };
    }

    try {
        return await response.json();
    } catch (_err) {
        return { data: { question: { description: "" } } };
    }
}

export async function getQuestionDescription(
    moduleId: string, 
    someId: string, 
    sectionId: string, 
    questionId: string
): Promise<any> {

    const questionDetails = await getQuestionDetails(moduleId, someId, sectionId, questionId);
    
    return {
        questionId,
        sectionId,
        moduleId,
        description: questionDetails?.data?.question?.description ?? ""
    }

}