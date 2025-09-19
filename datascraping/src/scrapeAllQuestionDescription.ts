import 'dotenv/config';
import moduleIdResponseJson from '../data/moduleIdResponse.json' with { type: 'json' };
import { getQuestionDetails } from './getQuestionDetails.js';
import { getModuleQuestionsRaw } from './getIds/getSectionAndQuestionIds.js';
import { saveToJson } from './utils/saveToJson.js';
import { readFile } from 'node:fs/promises';


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

async function loadAllQuestionsByModule(): Promise<ModuleQuestions[]> {
    // 1) Try condensed file
    try {
        const jsonPath = new URL('../data/allQuestionsByModule.json', import.meta.url);
        const content = await readFile(jsonPath, 'utf-8');
        return JSON.parse(content) as ModuleQuestions[];
    } catch {}

    // 2) Try raw questions file and condense
    try {
        const rawPath = new URL('../data/allQuestionsRawByModule.json', import.meta.url);
        const rawContent = await readFile(rawPath, 'utf-8');
        const raw = JSON.parse(rawContent) as { module: any, items: any[] }[] | { module: any, questions: any[] }[];
        // Support both shapes: earlier version had { moduleId, items } then updated to { module, items }
        return (raw as any[]).map((entry: any) => {
            const moduleId = entry?.module?.id ?? entry?.moduleId ?? "";
            const items = Array.isArray(entry?.items) ? entry.items : Array.isArray(entry?.questions) ? entry.questions : [];
            return {
                moduleId,
                questionIds: items.map((q: any) => ({
                    questionId: q?.id ?? q?.questionId ?? "",
                    sectionId: q?.section_id ?? q?.sectionId ?? ""
                }))
            };
        });
    } catch {}

    // 3) Fallback: fetch fresh using module list
    const someIdLocal = someId;
    const allModuleIds: string[] = (Array.isArray((moduleIdResponseJson as any)?.data)
        ? ((moduleIdResponseJson as any).data as any[]).flatMap((category: any) =>
            Array.isArray(category?.items)
                ? category.items.map((item: any) => item?.id).filter((id: any) => typeof id === 'string')
                : []
          )
        : []) as string[];
    const perModule = await Promise.all(allModuleIds.map(async (moduleId) => {
        const raw = await getModuleQuestionsRaw(moduleId, someIdLocal).catch(() => ({ data: { items: [] } }));
        const items = Array.isArray((raw as any)?.data?.items) ? (raw as any).data.items : [];
        return {
            moduleId,
            questionIds: items.map((q: any) => ({ questionId: q?.id ?? "", sectionId: q?.section_id ?? "" }))
        };
    }));
    return perModule;
}

// Build a lookup of module metadata (including category) by moduleId
const moduleMetaById: Map<string, any> = (() => {
    const map = new Map<string, any>();
    const categories = Array.isArray((moduleIdResponseJson as any)?.data) ? (moduleIdResponseJson as any).data : [];
    for (const group of categories) {
        const category = group?.category ?? {};
        const items = Array.isArray(group?.items) ? group.items : [];
        for (const item of items) {
            if (item?.id && typeof item.id === 'string') {
                map.set(item.id, {
                    id: item.id,
                    name: item?.name ?? "",
                    description: item?.description ?? "",
                    difficulty: item?.difficulty ?? "",
                    progress: item?.progress ?? 0,
                    no_of_questions: item?.no_of_questions ?? 0,
                    category: {
                        id: category?.id ?? "",
                        title: category?.title ?? ""
                    }
                });
            }
        }
    }
    return map;
})();

async function scrapeAllQuestionDescription() {

    const allQuestionsByModule: ModuleQuestions[] = await loadAllQuestionsByModule();

    let allData: ModuleQuestions[] = [...allQuestionsByModule];

    // Raw output grouped by module with metadata and raw responses
    const perModuleRaw: {
        module: any;
        questions: {
            moduleId: string;
            sectionId: string;
            questionId: string;
            description: string;
            response: any;
        }[]
    }[] = [];
    const totalModules = allQuestionsByModule.length;
    let moduleIndex = 0;
    for (const module of allQuestionsByModule) {
        moduleIndex++;
        const totalQuestions = module.questionIds.length;
        console.log(`Starting module ${moduleIndex}/${totalModules} (${module.moduleId}) with ${totalQuestions} questions`);

        const moduleMeta = moduleMetaById.get(module.moduleId) ?? { id: module.moduleId };
        const questionsRaw: {
            moduleId: string;
            sectionId: string;
            questionId: string;
            description: string;
            response: any;
        }[] = [];

        for (let i = 0; i < module.questionIds.length; i += 10) {
            const batchStart = i + 1;
            const batchEnd = Math.min(i + 10, totalQuestions);
            console.log(`Module ${moduleIndex}/${totalModules} (${module.moduleId}): fetching ${batchStart}-${batchEnd} of ${totalQuestions}`);
            const batchPromises = module.questionIds.slice(i, i + 10).map((question) =>
                getQuestionDetails(
                    module.moduleId,
                    someId,
                    question.sectionId,
                    question.questionId
                ).then((raw) => ({
                    questionId: question.questionId,
                    sectionId: question.sectionId,
                    moduleId: module.moduleId,
                    description: raw?.data?.question?.description ?? "",
                    response: raw
                })).catch(() => ({
                    questionId: question.questionId,
                    sectionId: question.sectionId,
                    moduleId: module.moduleId,
                    description: "",
                    response: {}
                }))
            );

            const batchResults = await Promise.all(batchPromises);
            const successes = batchResults.filter(r => r.description !== "").length;
            const failures = batchResults.length - successes;
            console.log(`Module ${moduleIndex}/${totalModules} (${module.moduleId}): completed ${batchStart}-${batchEnd} (success: ${successes}, failed: ${failures})`);
            questionsRaw.push(...batchResults);
        }
        perModuleRaw.push({ module: moduleMeta, questions: questionsRaw });
    }

    for (const description of perModuleRaw.flatMap(m => m.questions)) {
        const module = allData.find(module => module.moduleId === description.moduleId);
        if (module) {
            const target = module.questionIds.find(question => question.questionId === description.questionId);
            if (target) {
                target.description = description.description ?? "";
            }
        }
    }

    console.log(`Saving descriptions for ${allData.length} modules...`);
    await saveToJson('allQuestionDescriptionsRawByModule.json', perModuleRaw);

    // Build module -> sectionId -> questionId -> details structure
    const structured = perModuleRaw.map(({ module, questions }) => {
        const sections: Record<string, Record<string, any>> = {};
        for (const q of questions) {
            const sectionKey = q.sectionId ?? "";
            if (!sections[sectionKey]) sections[sectionKey] = {};
            sections[sectionKey][q.questionId] = (q.response?.data?.question ?? {});
        }
        return { module, sections };
    });
    await saveToJson('allQuestionDescriptionsStructured.json', structured);
    await saveToJson('allQuestionDescriptions.json', allData);
    console.log(`Done. Saved descriptions.`);
}

async function main() {
    await scrapeAllQuestionDescription();
}

main().catch((err) => {
    console.error('Unhandled error:', err);
});