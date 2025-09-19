// This file actually gets all questionIds only.
// However, it can be easily modified to get all sectionIds.

import 'dotenv/config';

export async function getModuleQuestionsRaw(
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