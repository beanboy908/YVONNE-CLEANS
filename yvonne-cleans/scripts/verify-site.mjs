import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDirectory, '..');
const htmlPath = resolve(projectRoot, 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const failures = [];

for (const requiredId of ['home', 'services', 'about', 'why', 'gallery', 'faq', 'contact']) {
  if (!html.includes(`id="${requiredId}"`)) {
    failures.push(`Missing required section id: ${requiredId}`);
  }
}

for (const href of html.matchAll(/(?:src|href)=["']([^"']+)["']/g)) {
  const value = href[1];
  if (value.startsWith('assets/') || value.startsWith('css/') || value.startsWith('js/')) {
    if (!existsSync(resolve(projectRoot, value))) {
      failures.push(`Missing local asset referenced by index.html: ${value}`);
    }
  }
}

if (!html.includes('rel="noopener"')) {
  failures.push('External links should include rel="noopener" where applicable.');
}

if (failures.length > 0) {
  console.error('Site verification failed:\n- ' + failures.join('\n- '));
  process.exit(1);
}

console.log('Yvonne Cleans static-site verification passed.');
