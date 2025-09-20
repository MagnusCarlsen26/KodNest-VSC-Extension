import { getModuleQuestionsRaw } from "./getIds/getSectionAndQuestionIds.js";
import 'dotenv/config';
import moduleIdResponseJson from '../data/moduleIdResponse.json' with { type: 'json' };
import { saveToJson } from './utils/saveToJson.js';

// Derive module IDs from moduleIdResponse.json: data[].items[].id
const allModuleIds: string[] = (Array.isArray((moduleIdResponseJson as any)?.data)
    ? ((moduleIdResponseJson as any).data as any[]).flatMap((category: any) =>
        Array.isArray(category?.items)
            ? category.items.map((item: any) => item?.id).filter((id: any) => typeof id === 'string')
            : []
      )
    : []) as string[];

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

const someId = "d466e3e4-1f96-4802-b0cc-eaa5b01e928d";

async function scrapeAllQuestions() {

    // Fetch raw data per module and attach module metadata (including category)
    const perModulePromises = allModuleIds.map(async (moduleId) => {
        const raw = await getModuleQuestionsRaw(moduleId, someId).catch(() => ({}));
        const meta = moduleMetaById.get(moduleId) ?? { id: moduleId };
        const items = Array.isArray((raw as any)?.data?.items) ? (raw as any).data.items : [];
        return { module: meta, response: raw, items };
    });

    const perModule = await Promise.all(perModulePromises);

    // Save raw data grouped by module, with module metadata
    await saveToJson('allQuestionsRawByModule.json', perModule);

    // Also produce condensed shape for compatibility
    const condensed = perModule.map(({ module, items }) => ({
        moduleId: (module as any)?.id ?? "",
        questionIds: items.map((q: any) => ({
            questionId: q?.id ?? "",
            sectionId: q?.section_id ?? "",
            status: q?.status ?? ""
        }))
    }));

    await saveToJson('allQuestionsByModule.json', condensed);
}

async function main() {
    await scrapeAllQuestions();
}

main().catch((err) => {
    console.error('Unhandled error:', err);
});