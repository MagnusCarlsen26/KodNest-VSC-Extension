import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function saveToJson(filename: string, data: any): Promise<void> {
    const outputFilePath = path.resolve(process.cwd(), 'data', filename);
    await mkdir(path.dirname(outputFilePath), { recursive: true });
    await writeFile(outputFilePath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Saved to ${outputFilePath}`);
}
