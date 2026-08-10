import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const state = JSON.parse(readFileSync('src/data/cms-state.json', 'utf8'));
const groups = new Map();
const collections = ['imageUses', 'uploads', 'assets', 'photos', 'sitePhotos'];

for (const collection of collections) {
  for (const item of state[collection] || []) {
    if (!item?.src) continue;
    const src = String(item.src);
    if (!groups.has(src)) groups.set(src, []);
    groups.get(src).push({ collection, id: item.id || '', label: item.label || '', usedBy: item.usedBy || [] });
  }
}

const uploadLabels = new Map();
for (const item of state.uploads || []) {
  const label = String(item.label || item.id || '').trim().toLowerCase();
  if (!label) continue;
  if (!uploadLabels.has(label)) uploadLabels.set(label, []);
  uploadLabels.get(label).push(item);
}

const duplicateSrc = [...groups.entries()]
  .filter(([, items]) => items.length > 1)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([src, items]) => ({ src, count: items.length, items }));

const duplicateUploadsByLabel = [...uploadLabels.entries()]
  .filter(([, items]) => items.length > 1)
  .sort((a, b) => b[1].length - a[1].length)
  .map(([label, items]) => ({ label, count: items.length, srcs: items.map((item) => item.src) }));

const report = {
  generatedAt: new Date().toISOString(),
  totals: Object.fromEntries(collections.map((key) => [key, (state[key] || []).length])),
  duplicateSrc,
  duplicateUploadsByLabel,
};

mkdirSync('docs/reports', { recursive: true });
writeFileSync('docs/reports/cms-media-audit.json', `${JSON.stringify(report, null, 2)}\n`);

const md = [
  '# Auditoria de mídia do CMS',
  '',
  `Gerado em: ${report.generatedAt}`,
  '',
  '## Totais',
  '',
  ...Object.entries(report.totals).map(([key, value]) => `- ${key}: ${value}`),
  '',
  '## Uploads duplicados por nome',
  '',
  ...duplicateUploadsByLabel.slice(0, 20).map((group) => `- ${group.label}: ${group.count} arquivos\n${group.srcs.map((src) => `  - ${src}`).join('\n')}`),
  '',
  '## Mesma imagem referenciada em várias coleções',
  '',
  ...duplicateSrc.slice(0, 30).map((group) => `- ${group.src}: ${group.count} referências\n${group.items.map((item) => `  - ${item.collection}: ${item.id || '(sem id)'} - ${item.label || '(sem label)'}`).join('\n')}`),
  '',
].join('\n');
writeFileSync('docs/reports/cms-media-audit.md', md);

console.log(`CMS media audit: ${duplicateSrc.length} src duplicados, ${duplicateUploadsByLabel.length} labels de upload duplicados.`);
