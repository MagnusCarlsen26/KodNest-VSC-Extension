import { extractSectionAndQuestionId } from "./getIds/getSectionAndQuestionIds.js";
import 'dotenv/config';
import allModuleIdsJson from '../data/allModuleIds.json' with { type: 'json' };
import { saveToJson } from './utils/saveToJson.js';

const allModuleIds: string[] = allModuleIdsJson as unknown as string[];

const someId = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d";

async function scrapeAllQuestions() {

    let allData = allModuleIds.map(moduleId => ({
        moduleId,
        questionIds: [] as { questionId: string; sectionId: string }[]
    }))

    let questionsPromise = []
    for (const moduleId of allModuleIds) {

        questionsPromise.push(extractSectionAndQuestionId(moduleId, someId));

    }

    let questions = await Promise.all(questionsPromise);

    for (const question of questions) {
        const entry = allData.find(item => item.moduleId === question.moduleId)
        if (entry) {
            entry.questionIds.push(...question.questionIds);
        }
    }

    await saveToJson('allQuestionsByModule.json', allData);
}

async function main() {
    await scrapeAllQuestions();
}

main().catch((err) => {
    console.error('Unhandled error:', err);
});