import 'dotenv/config';
import allQuestionsByModuleJson from '../data/allQuestionsByModule.json' with { type: 'json' };
import { getQuestionDescription } from './getQuestionDetails.js';
import { saveToJson } from './utils/saveToJson.js';


const someId = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d";

type QuestionRef = {
    questionId: string;
    sectionId: string;
    description?: string;
};

type ModuleQuestions = {
    moduleId: string;
    questionIds: QuestionRef[];
};

const allQuestionsByModule: ModuleQuestions[] = allQuestionsByModuleJson as unknown as ModuleQuestions[];

async function scrapeAllQuestionDescription() {

    let allData: ModuleQuestions[] = [...allQuestionsByModule];


    const descriptions = [] as {
        questionId: string;
        sectionId: string;
        moduleId: string;
        description: string;
    }[];
    const totalModules = allQuestionsByModule.length;
    let moduleIndex = 0;
    for (const module of allQuestionsByModule) {
        moduleIndex++;
        const totalQuestions = module.questionIds.length;
        console.log(`Starting module ${moduleIndex}/${totalModules} (${module.moduleId}) with ${totalQuestions} questions`);

        for (let i = 0; i < module.questionIds.length; i += 10) {
            const batchStart = i + 1;
            const batchEnd = Math.min(i + 10, totalQuestions);
            console.log(`Module ${moduleIndex}/${totalModules} (${module.moduleId}): fetching ${batchStart}-${batchEnd} of ${totalQuestions}`);
            const batchPromises = module.questionIds.slice(i, i + 10).map((question) =>
                getQuestionDescription(
                    module.moduleId,
                    someId,
                    question.sectionId,
                    question.questionId
                ).catch(() => ({
                    questionId: question.questionId,
                    sectionId: question.sectionId,
                    moduleId: module.moduleId,
                    description: ""
                }))
            );

            const batchResults = await Promise.all(batchPromises);
            const successes = batchResults.filter(r => r.description !== "").length;
            const failures = batchResults.length - successes;
            console.log(`Module ${moduleIndex}/${totalModules} (${module.moduleId}): completed ${batchStart}-${batchEnd} (success: ${successes}, failed: ${failures})`);
            descriptions.push(...batchResults);
        }
    }

    for (const description of descriptions) {
        const module = allData.find(module => module.moduleId === description.moduleId);
        if (module) {
            const target = module.questionIds.find(question => question.questionId === description.questionId);
            if (target) {
                target.description = description.description ?? "";
            }
        }
    }

    console.log(`Saving descriptions for ${allData.length} modules...`);
    await saveToJson('allQuestionDescriptions.json', allData);
    console.log(`Done. Saved descriptions.`);
}

async function main() {
    await scrapeAllQuestionDescription();
}

main().catch((err) => {
    console.error('Unhandled error:', err);
});