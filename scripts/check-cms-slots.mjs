import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const state = JSON.parse(readFileSync(join(root, 'src/data/cms-state.json'), 'utf8'));
const registered = new Set((state.imageUses || []).map((item) => item.id));
const slotPattern = /data-cms-use="([^"]+)"/g;
const files = globSync('src/pages/**/*.astro', { cwd: root });
const declared = [];

for (const file of files) {
  const source = readFileSync(join(root, file), 'utf8');
  for (const match of source.matchAll(slotPattern)) {
    declared.push({ file, id: match[1] });
  }
}

const missing = declared.filter((slot) => !registered.has(slot.id));
const stale = [...registered].filter((id) => !declared.some((slot) => slot.id === id));

if (missing.length) {
  console.error('CMS slots declared in pages but missing from src/data/cms-state.json:');
  for (const slot of missing) console.error(`- ${slot.id} (${slot.file})`);
}

if (stale.length) {
  console.warn('CMS imageUses registered but not found as data-cms-use in pages:');
  for (const id of stale) console.warn(`- ${id}`);
}

console.log(`CMS slot check: ${declared.length} declared, ${registered.size} registered, ${missing.length} missing, ${stale.length} stale.`);

if (missing.length) process.exit(1);
