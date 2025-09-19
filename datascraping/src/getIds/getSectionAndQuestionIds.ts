// This file actually gets all questionIds only.
// However, it can be easily modified to get all sectionIds.

import 'dotenv/config';

const moduleId = "7604eebf-7c9d-44ce-814d-c2ab6c79ffc3";
const someId = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d";

async function getSectionAndQuestionId(
    moduleId: string, 
    someId: string
): Promise<any> {
    const headers: Record<string, string> = {
        "accept": "application/json, text/plain, */*",
    };
    if (process.env.KODNEST_AUTHORIZATION) {
        headers["authorization"] = process.env.KODNEST_AUTHORIZATION as string;
    }

    const response = await fetch(`https://api.kodnest.in/assessment-service/api/v2/consumers/practices/${moduleId}/${someId}/questions?page=0&page_size=100000&tab=all`, {
        headers: headers,
        body: null,
        method: "GET"
    });

    if (!response.ok) {
        return { data: { items: [] } };
    }

    try {
        return await response.json();
    } catch (_err) {
        return { data: { items: [] } };
    }
}

export async function extractSectionAndQuestionId(
    moduleId: string,
    someId: string
): Promise<{
    moduleId: string,
    questionIds: { questionId: string, sectionId: string }[]
}> {
    const data = await getSectionAndQuestionId(moduleId, someId);
    const items = Array.isArray(data?.data?.items) ? data.data.items : [];

    return {
        moduleId: moduleId,
        questionIds: items.map((question: any) => ({
            questionId : question.id,
            sectionId : question.section_id
        }))
    };
}