import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Load the detailed database file
const databasePath = '/home/khs/Desktop/Projects/KodNest-VSC-Extension/vscode-extension/database/allQuestionDescriptions.json';
const statusPath = '/home/khs/Desktop/Projects/KodNest-VSC-Extension/datascraping/data/allQuestionDescriptions.json';

try {
  const databaseData = JSON.parse(readFileSync(databasePath, 'utf-8'));
  const statusData = JSON.parse(readFileSync(statusPath, 'utf-8'));

  // Create a lookup map for status by moduleId -> questionId
  const statusMap = new Map<string, Map<string, string>>();

  for (const module of statusData) {
    const questionMap = new Map<string, string>();
    for (const question of module.questionIds) {
      questionMap.set(question.questionId, question.status);
    }
    statusMap.set(module.moduleId, questionMap);
  }

  // Merge status into database data
  for (const module of databaseData) {
    const moduleId = module.module.id;
    const statusQuestionMap = statusMap.get(moduleId);

    if (statusQuestionMap) {
      // Iterate through sections and questions
      for (const sectionId in module.sections) {
        const section = module.sections[sectionId];
        for (const questionId in section) {
          const question = section[questionId];
          const status = statusQuestionMap.get(questionId);
          if (status) {
            question.status = status;
          }
        }
      }
    }
  }

  // Write the merged data back to the database file
  const outputPath = '/home/khs/Desktop/Projects/KodNest-VSC-Extension/vscode-extension/database/allQuestionDescriptions.json';
  writeFileSync(outputPath, JSON.stringify(databaseData, null, 2));

  console.log('✅ Successfully merged status information into database file');
  console.log(`📁 Updated: ${outputPath}`);

} catch (error) {
  console.error('❌ Error merging files:', error);
}
