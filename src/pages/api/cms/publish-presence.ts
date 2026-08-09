import type { APIRoute } from 'astro';
import cmsState from '../../../data/cms-state.json';
import { normalizeCmsState, validateCmsState } from '../../../lib/cms-schema';

const repo = 'H0m0Lud3ns/gondwanafc-time-educacao';
const branch = 'main';
const cmsPath = 'src/data/cms-state.json';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
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

    const issues = validateCmsState(body);
    const errors = issues.filter((issue) => issue.severity === 'error');
    if (errors.length) {
      return json({ ok: false, error: 'Validação falhou antes de publicar.', issues }, 422);
    }

    const normalized = normalizeCmsState(body);
    const nextState = {
      ...cmsState,
      ...normalized,
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
      count: normalized.publicPresence.length,
      photos: normalized.sitePhotos.length,
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500);
  }
};
