import type { APIRoute } from 'astro';
import { validateCmsState } from '../../../lib/cms-schema';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const issues = validateCmsState(body);
    return json({
      ok: !issues.some((issue) => issue.severity === 'error'),
      issues,
      errors: issues.filter((issue) => issue.severity === 'error').length,
      warnings: issues.filter((issue) => issue.severity === 'warning').length,
    });
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : 'Erro desconhecido.' }, 400);
  }
};
