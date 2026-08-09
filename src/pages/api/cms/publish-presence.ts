import type { APIRoute } from 'astro';
import cmsState from '../../../data/cms-state.json';

const repo = 'H0m0Lud3ns/gondwanafc-time-educacao';
const branch = 'main';
const cmsPath = 'src/data/cms-state.json';

type PresenceItem = {
  id?: string;
  vehicle?: string;
  tier?: string;
  title?: string;
  url?: string;
  visible?: boolean;
};

type PhotoItem = {
  id?: string;
  label?: string;
  where?: string;
  src?: string;
  alt?: string;
  original?: string;
  type?: string;
  usage?: string;
  risk?: string;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function cleanItem(item: PresenceItem, index: number) {
  const vehicle = String(item.vehicle || '').trim();
  const tier = String(item.tier || '').trim();
  const title = String(item.title || '').trim();
  const url = String(item.url || '').trim();

  if (!vehicle || !tier || !title || !url) {
    throw new Error(`Registro ${index + 1}: veículo, tier, título e URL são obrigatórios.`);
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('invalid protocol');
  } catch {
    throw new Error(`Registro ${index + 1}: URL inválida.`);
  }

  const id = String(item.id || vehicle)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `registro-${index + 1}`;

  return {
    id,
    vehicle,
    tier,
    title,
    url,
    visible: item.visible !== false,
  };
}

function cleanPhoto(item: PhotoItem, index: number) {
  const src = String(item.src || '').trim();
  const original = String(item.original || item.src || '').trim();
  const label = String(item.label || `Foto ${index + 1}`).trim();

  if (!src || !original) {
    throw new Error(`Foto ${index + 1}: src e arquivo original são obrigatórios.`);
  }

  const isAcceptedSrc = src.startsWith('/legacy-assets/') || src.startsWith('/assets/') || src.startsWith('data:image/') || src.startsWith('https://') || src.startsWith('http://');
  if (!isAcceptedSrc) {
    throw new Error(`Foto ${index + 1}: caminho de imagem inválido.`);
  }

  const id = String(item.id || original)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || `foto-${index + 1}`;

  return {
    id,
    label,
    where: String(item.where || '').trim(),
    src,
    alt: String(item.alt || '').trim(),
    original,
    type: String(item.type || 'imagem do site').trim(),
    usage: String(item.usage || 'Imagem usada no site publico').trim(),
    risk: String(item.risk || 'revisar antes de publicar').trim(),
  };
}

async function githubRequest(path: string, init: RequestInit = {}) {
  const token = import.meta.env.GITHUB_CONTENT_TOKEN;
  if (!token) throw new Error('GITHUB_CONTENT_TOKEN ausente no ambiente Vercel.');

  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28',
      ...(init.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `GitHub API falhou com status ${response.status}.`);
  }
  return data;
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const password = String(body.password || '').trim();

    if (!import.meta.env.CMS_PRODUCTION_PASSWORD) {
      return json({ ok: false, error: 'CMS_PRODUCTION_PASSWORD ausente no ambiente Vercel.' }, 500);
    }

    if (password !== import.meta.env.CMS_PRODUCTION_PASSWORD) {
      return json({ ok: false, error: 'Senha de produção inválida.' }, 401);
    }

    if (!Array.isArray(body.publicPresence)) {
      return json({ ok: false, error: 'publicPresence precisa ser uma lista.' }, 422);
    }

    const publicPresence = body.publicPresence.map(cleanItem);
    const photos = Array.isArray(body.photos) ? body.photos.map(cleanPhoto) : (cmsState as any).photos;
    const sitePhotos = Array.isArray(body.sitePhotos) ? body.sitePhotos.map(cleanPhoto) : photos;
    const nextState = {
      ...cmsState,
      home: body.home && typeof body.home === 'object' ? body.home : (cmsState as any).home,
      projects: Array.isArray(body.projects) ? body.projects : (cmsState as any).projects,
      links: Array.isArray(body.links) ? body.links : (cmsState as any).links,
      siteMap: Array.isArray(body.siteMap) ? body.siteMap : (cmsState as any).siteMap,
      seo: body.seo && typeof body.seo === 'object' ? body.seo : (cmsState as any).seo,
      uploads: Array.isArray(body.uploads) ? body.uploads : (cmsState as any).uploads,
      publicPresence,
      photos,
      sitePhotos,
      updatedAt: new Date().toISOString(),
    };

    const current = await githubRequest(`/repos/${repo}/contents/${cmsPath}?ref=${branch}`);
    const content = Buffer.from(`${JSON.stringify(nextState, null, 2)}\n`).toString('base64');

    const result = await githubRequest(`/repos/${repo}/contents/${cmsPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        branch,
        message: 'chore: publish cms content',
        content,
        sha: current.sha,
      }),
    });

    return json({
      ok: true,
      commit: result.commit?.sha,
      url: result.commit?.html_url,
      count: publicPresence.length,
      photos: photos?.length || 0,
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500);
  }
};
