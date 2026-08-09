import type { APIRoute } from 'astro';
import { cmsBranch, cmsRepo, githubRequest } from '../../../lib/cms/github';

const maxUploadBytes = 4 * 1024 * 1024;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function slug(input: string) {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'imagem-cms';
}

function extensionFor(type: string) {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const form = await request.formData();
    const password = String(form.get('password') || '').trim();
    const file = form.get('file');

    if (!import.meta.env.CMS_PRODUCTION_PASSWORD) {
      return json({ ok: false, error: 'CMS_PRODUCTION_PASSWORD ausente no ambiente Vercel.' }, 500);
    }

    if (password !== import.meta.env.CMS_PRODUCTION_PASSWORD) {
      return json({ ok: false, error: 'Senha de produção inválida.' }, 401);
    }

    if (!(file instanceof File)) {
      return json({ ok: false, error: 'Arquivo de imagem obrigatório.' }, 422);
    }

    if (!file.type.startsWith('image/')) {
      return json({ ok: false, error: 'O arquivo precisa ser uma imagem.' }, 422);
    }

    if (file.size > maxUploadBytes) {
      return json({ ok: false, error: 'Imagem maior que 4 MB. Comprima antes de enviar.' }, 413);
    }

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const base = slug(file.name);
    const ext = extensionFor(file.type);
    const fileName = `${base}-${Date.now()}.${ext}`;
    const publicPath = `/uploads/cms/${year}/${month}/${fileName}`;
    const repoPath = `public${publicPath}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await githubRequest(`/repos/${cmsRepo()}/contents/${repoPath}`, {
      method: 'PUT',
      body: JSON.stringify({
        branch: cmsBranch(),
        message: `cms: upload media ${fileName}`,
        content: buffer.toString('base64'),
      }),
    });

    return json({
      ok: true,
      asset: {
        id: slug(fileName),
        label: file.name.replace(/\.[^.]+$/i, ''),
        src: publicPath,
        type: file.type,
        size: file.size,
        uploadedAt: now.toISOString(),
      },
      commit: result.commit?.sha,
      url: result.content?.html_url,
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 500);
  }
};
