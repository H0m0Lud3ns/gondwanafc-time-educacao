import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';

const state = JSON.parse(readFileSync('src/data/cms-state.json', 'utf8'));
const pages = ['src/pages/index.astro', 'src/pages/caderno.astro', 'src/pages/blog.astro', 'src/pages/manto-abya-yala.astro'];
const source = pages.map((path) => readFileSync(path, 'utf8')).join('\n');
const declared = [...source.matchAll(/data-cms-use="([^"]+)"/g)].map((match) => match[1]);
const registered = new Map((state.imageUses || []).map((item) => [item.id, item]));
const srcs = new Set([
  ...(state.uploads || []).map((item) => item.src),
  ...(state.assets || []).map((item) => item.src),
  ...(state.photos || []).map((item) => item.src),
  ...(state.sitePhotos || []).map((item) => item.src),
  ...(state.imageUses || []).map((item) => item.src),
].filter(Boolean));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function mergeById(current, base, draft) {
  const draftById = new Map(draft.map((item) => [String(item.id || ''), item]));
  const baseById = new Map(base.map((item) => [String(item.id || ''), item]));
  const currentById = new Map(current.map((item) => [String(item.id || ''), item]));
  const ids = new Set([...currentById.keys(), ...draftById.keys()]);
  return [...ids].filter(Boolean).map((id) => {
    const currentItem = currentById.get(id) || {};
    const baseItem = baseById.get(id) || {};
    const draftItem = draftById.get(id) || currentItem;
    return JSON.stringify(baseItem) === JSON.stringify(draftItem) ? currentItem : draftItem;
  });
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('todo data-cms-use declarado existe em imageUses', () => {
  const missing = declared.filter((id) => !registered.has(id));
  assert(missing.length === 0, `missing slots: ${missing.join(', ')}`);
});

test('todo imageUse.src existe em alguma colecao de midia', () => {
  const missing = (state.imageUses || []).filter((item) => item.src && !srcs.has(item.src));
  assert(missing.length === 0, `src sem asset: ${missing.map((item) => item.id).join(', ')}`);
});

test('nao ha base64 em payload publicavel', () => {
  const offenders = ['imageUses', 'uploads', 'photos', 'sitePhotos'].flatMap((key) => (state[key] || []).filter((item) => String(item.src || '').startsWith('data:image/')).map((item) => `${key}:${item.id}`));
  assert(offenders.length === 0, `base64 encontrado: ${offenders.join(', ')}`);
});

test('merge preserva mudanca remota quando rascunho nao tocou item', () => {
  const base = [{ id: 'a', src: '/old.jpg' }];
  const current = [{ id: 'a', src: '/remote.jpg' }];
  const draft = [{ id: 'a', src: '/old.jpg' }];
  const merged = mergeById(current, base, draft);
  assert(merged[0].src === '/remote.jpg', `esperava remote, veio ${merged[0].src}`);
});

test('merge aplica mudanca do rascunho quando item foi tocado', () => {
  const base = [{ id: 'a', src: '/old.jpg' }];
  const current = [{ id: 'a', src: '/remote.jpg' }];
  const draft = [{ id: 'a', src: '/draft.jpg' }];
  const merged = mergeById(current, base, draft);
  assert(merged[0].src === '/draft.jpg', `esperava draft, veio ${merged[0].src}`);
});

test('merge nao perde item criado remotamente', () => {
  const base = [{ id: 'a', src: '/old.jpg' }];
  const current = [{ id: 'a', src: '/old.jpg' }, { id: 'b', src: '/remote-new.jpg' }];
  const draft = [{ id: 'a', src: '/draft.jpg' }];
  const merged = mergeById(current, base, draft);
  assert(merged.some((item) => item.id === 'b'), 'item remoto b desapareceu');
});

test('merge nao consegue deletar item removido no rascunho - inconsistencia conhecida', () => {
  const base = [{ id: 'a', src: '/old.jpg' }];
  const current = [{ id: 'a', src: '/old.jpg' }];
  const draft = [];
  const merged = mergeById(current, base, draft);
  assert(merged.some((item) => item.id === 'a'), 'este teste documenta que delete nao e suportado');
});

test('ids de imageUses sao unicos', () => {
  const ids = (state.imageUses || []).map((item) => item.id);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert(duplicates.length === 0, `ids duplicados: ${duplicates.join(', ')}`);
});

let failed = 0;
for (const item of tests) {
  try {
    item.fn();
    console.log(`PASS ${item.name}`);
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${item.name}: ${error.message}`);
  }
}
console.log(`CMS stress run ${randomUUID()}: ${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
