import type { APIRoute } from 'astro';
import cmsState from '../../../data/cms-state.json';
import { cmsBranch, cmsRepo, githubRequest } from '../../../lib/cms/github';
import { normalizeCmsState, validateCmsState } from '../../../lib/cms-schema';

const cmsPath = 'src/data/cms-state.json';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function decodeGithubJson(content: string) {
  const normalized = content.replace(/\n/g, '');
  return JSON.parse(Buffer.from(normalized, 'base64').toString('utf8'));
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

    const current = await githubRequest(`/repos/${cmsRepo()}/contents/${cmsPath}?ref=${cmsBranch()}`);
    const currentState = decodeGithubJson(current.content || '');
    const baseUpdatedAt = String(body.baseUpdatedAt || '').trim();
    const currentUpdatedAt = String(currentState.updatedAt || '').trim();

    if (baseUpdatedAt && currentUpdatedAt && baseUpdatedAt !== currentUpdatedAt) {
      return json({
        ok: false,
        error: 'A produção mudou depois que este rascunho foi aberto. Recarregue o CMS antes de publicar para evitar sobrescrever alterações recentes.',
        conflict: true,
        currentUpdatedAt,
        baseUpdatedAt,
      }, 409);
    }

    const normalized = normalizeCmsState(body);
    const nextState = {
      ...cmsState,
      ...currentState,
      ...normalized,
      updatedAt: new Date().toISOString(),
    };

    const content = Buffer.from(`${JSON.stringify(nextState, null, 2)}\n`).toString('base64');

    const result = await githubRequest(`/repos/${cmsRepo()}/contents/${cmsPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        branch: cmsBranch(),
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
      imageUses: normalized.imageUses?.length || 0,
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500);
  }
};
