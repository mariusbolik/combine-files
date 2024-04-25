import { readdir, readFile, writeFile } from 'node:fs/promises';

const DIR = './content/api-examples'

// Specify the type for `dir` as `string`.
async function findMarkdownFiles(dir: string): Promise<string[]> {
  // readdir returns an array of Dirent when { withFileTypes: true } is used.
  let files = await readdir(dir, { withFileTypes: true });
  let markdownFiles: string[] = [];

  for (let file of files) {
    let fullPath: string = `${dir}/${file.name}`;
    if (file.isDirectory()) {
      markdownFiles = markdownFiles.concat(await findMarkdownFiles(fullPath));
    } else if (file.isFile() && file.name.endsWith('.ts')) {
      markdownFiles.push(fullPath);
    }
  }

  return markdownFiles;
}

// Specify the type for `outputFile` as `string`.
async function combineMarkdownFiles(outputFile: string): Promise<void> {
  const markdownFiles: string[] = await findMarkdownFiles(DIR);
  let combinedContent: string = '';

  for (let file of markdownFiles) {
    // readFile returns a string when 'utf8' is used as the encoding.
    const content: string = await readFile(file, 'utf8');
    combinedContent += content + '\n';
  }

  await writeFile(outputFile, combinedContent);
}

combineMarkdownFiles('api.ts').then(() => {
  console.log('All markdown files have been combined into combined.md');
});
