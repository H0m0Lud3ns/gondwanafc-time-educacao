import cmsState from '../data/cms-state.json';

type SitePhoto = {
  original?: string;
  src?: string;
  alt?: string;
};

type ImageUse = {
  id?: string;
  original?: string;
  src?: string;
  alt?: string;
};

const photos = Array.isArray(cmsState.sitePhotos) ? (cmsState.sitePhotos as SitePhoto[]) : [];
const imageUses = Array.isArray((cmsState as { imageUses?: ImageUse[] }).imageUses) ? ((cmsState as { imageUses?: ImageUse[] }).imageUses || []) : [];
const byOriginal = new Map(photos.map((photo) => [photo.original || photo.src, photo]));
const byUseId = new Map(imageUses.map((use) => [use.id, use]));

export function imageFor(original: string) {
  return byOriginal.get(original)?.src || original;
}

export function imageUseFor(id: string, original: string) {
  return byUseId.get(id)?.src || imageFor(original);
}

export function altFor(original: string, fallback = '') {
  return byOriginal.get(original)?.alt || fallback;
}

export function altUseFor(id: string, original: string, fallback = '') {
  return byUseId.get(id)?.alt || altFor(original, fallback);
}

export function publicImageFor(original: string) {
  const src = imageFor(original);
  if (/^(https?:|data:)/.test(src)) return src;
  return `https://www.gondwanafc.com${src}`;
}
