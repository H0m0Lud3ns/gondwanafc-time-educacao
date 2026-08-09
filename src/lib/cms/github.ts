const defaultRepo = 'H0m0Lud3ns/gondwanafc-time-educacao';
const defaultBranch = 'main';

export function cmsRepo() {
  return import.meta.env.CMS_GITHUB_REPO || defaultRepo;
}

export function cmsBranch() {
  return import.meta.env.CMS_GITHUB_BRANCH || defaultBranch;
}

export async function githubRequest(path: string, init: RequestInit = {}) {
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
