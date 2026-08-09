import cmsState from '../data/cms-state.json';

type SitePhoto = {
  original?: string;
  src?: string;
  alt?: string;
};

const photos = Array.isArray(cmsState.sitePhotos) ? (cmsState.sitePhotos as SitePhoto[]) : [];
const byOriginal = new Map(photos.map((photo) => [photo.original || photo.src, photo]));

export function imageFor(original: string) {
  return byOriginal.get(original)?.src || original;
}

export function altFor(original: string, fallback = '') {
  return byOriginal.get(original)?.alt || fallback;
}

export function publicImageFor(original: string) {
  const src = imageFor(original);
  if (/^(https?:|data:)/.test(src)) return src;
  return `https://www.gondwanafc.com${src}`;
}
