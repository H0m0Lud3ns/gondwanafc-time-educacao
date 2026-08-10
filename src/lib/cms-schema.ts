export type PublicPresenceItem = {
  id: string;
  vehicle: string;
  tier: string;
  title: string;
  url: string;
  visible: boolean;
};

export type SitePhoto = {
  id: string;
  label: string;
  where: string;
  src: string;
  alt: string;
  original: string;
  type: string;
  usage: string;
  risk: string;
};

export type ImageUse = {
  id: string;
  label: string;
  page: string;
  section: string;
  src: string;
  alt: string;
  original: string;
};

export type UploadedAsset = {
  id: string;
  label: string;
  src: string;
  type: string;
  usage: string;
  uploadedAt?: string;
};

export type MediaAsset = UploadedAsset & {
  original?: string;
  alt?: string;
  usedBy?: string[];
};

export type CmsState = {
  schemaVersion?: number;
  publicPresence: PublicPresenceItem[];
  sitePhotos: SitePhoto[];
  photos?: SitePhoto[];
  imageUses?: ImageUse[];
  uploads?: UploadedAsset[];
  assets?: MediaAsset[];
  home?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  projects?: Array<Record<string, unknown>>;
  links?: Array<Record<string, unknown>>;
  siteMap?: Array<Record<string, unknown>>;
  updatedAt?: string;
};

export type ValidationIssue = {
  path: string;
  message: string;
  severity: 'error' | 'warning';
};

function slug(input: string, fallback: string) {
  const value = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return value || fallback;
}

export function cleanPublicPresence(item: Partial<PublicPresenceItem>, index: number): PublicPresenceItem {
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

  return {
    id: slug(String(item.id || vehicle), `registro-${index + 1}`),
    vehicle,
    tier,
    title,
    url,
    visible: item.visible !== false,
  };
}

export function cleanImageUse(item: Partial<ImageUse>, index: number): ImageUse {
  const src = String(item.src || '').trim();
  const original = String(item.original || item.src || '').trim();
  const id = String(item.id || `uso-${index + 1}`).trim();

  if (!id || !src || !original) {
    throw new Error(`Uso de imagem ${index + 1}: id, src e arquivo original são obrigatórios.`);
  }

  const isAcceptedSrc = src.startsWith('/legacy-assets/') || src.startsWith('/assets/') || src.startsWith('/uploads/cms/') || src.startsWith('https://') || src.startsWith('http://');
  if (!isAcceptedSrc) {
    throw new Error(`Uso de imagem ${index + 1}: publique a imagem primeiro na biblioteca de mídia.`);
  }

  return {
    id,
    label: String(item.label || `Uso ${index + 1}`).trim(),
    page: String(item.page || '').trim(),
    section: String(item.section || '').trim(),
    src,
    alt: String(item.alt || '').trim(),
    original,
  };
}

export function cleanUploadedAsset(item: Partial<UploadedAsset>, index: number): UploadedAsset {
  const src = String(item.src || '').trim();
  if (!src) throw new Error(`Imagem de biblioteca ${index + 1}: src obrigatório.`);

  const isAcceptedSrc = src.startsWith('/legacy-assets/') || src.startsWith('/assets/') || src.startsWith('/uploads/cms/') || src.startsWith('https://') || src.startsWith('http://');
  if (!isAcceptedSrc) {
    throw new Error(`Imagem de biblioteca ${index + 1}: caminho inválido.`);
  }

  return {
    id: slug(String(item.id || item.label || src), `asset-${index + 1}`),
    label: String(item.label || `Imagem ${index + 1}`).trim(),
    src,
    type: String(item.type || 'upload').trim(),
    usage: String(item.usage || 'Biblioteca CMS').trim(),
    uploadedAt: item.uploadedAt,
  };
}

export function cleanSitePhoto(item: Partial<SitePhoto>, index: number): SitePhoto {
  const src = String(item.src || '').trim();
  const original = String(item.original || item.src || '').trim();
  const label = String(item.label || `Foto ${index + 1}`).trim();

  if (!src || !original) {
    throw new Error(`Foto ${index + 1}: src e arquivo original são obrigatórios.`);
  }

  const isAcceptedSrc = src.startsWith('/legacy-assets/') || src.startsWith('/assets/') || src.startsWith('/uploads/cms/') || src.startsWith('https://') || src.startsWith('http://');
  if (!isAcceptedSrc) {
    throw new Error(`Foto ${index + 1}: publique a imagem primeiro na biblioteca de mídia.`);
  }

  return {
    id: slug(String(item.id || original), `foto-${index + 1}`),
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


function cloneRecords<T extends Record<string, unknown>>(items: unknown): T[] {
  return Array.isArray(items) ? items.filter((item): item is T => !!item && typeof item === 'object').map((item) => ({ ...item })) : [];
}

export function deriveMediaAssets(sitePhotos: SitePhoto[], imageUses: ImageUse[], uploads: UploadedAsset[]): MediaAsset[] {
  const bySrc = new Map<string, MediaAsset>();
  const upsert = (item: Partial<MediaAsset>, usedBy?: string) => {
    const src = String(item.src || '').trim();
    if (!src) return;
    const current = bySrc.get(src) || {
      id: slug(String(item.id || item.label || src), `asset-${bySrc.size + 1}`),
      label: String(item.label || item.alt || src).trim(),
      src,
      type: String(item.type || 'imagem').trim(),
      usage: String(item.usage || 'Biblioteca CMS').trim(),
      original: item.original,
      alt: item.alt,
      uploadedAt: item.uploadedAt,
      usedBy: [],
    };
    current.label = current.label || String(item.label || item.alt || src).trim();
    current.original = current.original || item.original;
    current.alt = current.alt || item.alt;
    current.uploadedAt = current.uploadedAt || item.uploadedAt;
    if (usedBy && !current.usedBy?.includes(usedBy)) current.usedBy?.push(usedBy);
    bySrc.set(src, current);
  };

  sitePhotos.forEach((photo) => upsert(photo, photo.id));
  imageUses.forEach((use) => upsert({ ...use, type: 'slot editorial', usage: use.section || use.page }, use.id));
  uploads.forEach((asset) => upsert(asset));

  return [...bySrc.values()].sort((a, b) => String(a.label || a.src).localeCompare(String(b.label || b.src)));
}

export function normalizeCmsState(input: Partial<CmsState>): CmsState {
  const publicPresence = Array.isArray(input.publicPresence) ? input.publicPresence.map(cleanPublicPresence) : [];
  const sourcePhotos = Array.isArray(input.sitePhotos) ? input.sitePhotos : Array.isArray(input.photos) ? input.photos : [];
  const sitePhotos = sourcePhotos.map(cleanSitePhoto);
  const imageUses = Array.isArray(input.imageUses) ? input.imageUses.map(cleanImageUse) : [];
  const uploads = Array.isArray(input.uploads) ? input.uploads.map(cleanUploadedAsset) : [];
  const assets = deriveMediaAssets(sitePhotos, imageUses, uploads);

  return {
    schemaVersion: Math.max(Number(input.schemaVersion || 1), 2),
    publicPresence,
    sitePhotos,
    photos: sitePhotos,
    imageUses,
    uploads,
    assets,
    home: input.home && typeof input.home === 'object' ? { ...input.home } : {},
    seo: input.seo && typeof input.seo === 'object' ? { ...input.seo } : {},
    projects: cloneRecords(input.projects),
    links: cloneRecords(input.links),
    siteMap: cloneRecords(input.siteMap),
    updatedAt: input.updatedAt,
  };
}

export function validateCmsState(input: Partial<CmsState>): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!Array.isArray(input.publicPresence)) {
    issues.push({ path: 'publicPresence', message: 'Presença pública precisa ser uma lista.', severity: 'error' });
  }

  if (!Array.isArray(input.sitePhotos) && !Array.isArray(input.photos)) {
    issues.push({ path: 'sitePhotos', message: 'Fotos do site precisam ser uma lista.', severity: 'error' });
  }

  const photos = Array.isArray(input.sitePhotos) ? input.sitePhotos : Array.isArray(input.photos) ? input.photos : [];
  const imageUses = Array.isArray(input.imageUses) ? input.imageUses : [];
  const uploads = Array.isArray(input.uploads) ? input.uploads : [];
  uploads.forEach((asset, index) => {
    if (String(asset.src || '').startsWith('data:image/')) issues.push({ path: `uploads.${index}.src`, message: 'Imagem em base64 não pode ficar na biblioteca. Publique como arquivo real.', severity: 'error' });
  });

  imageUses.forEach((use, index) => {
    if (!use.alt) issues.push({ path: `imageUses.${index}.alt`, message: `Uso "${use.label || index + 1}" está sem alt text.`, severity: 'warning' });
    if (String(use.src || '').startsWith('data:image/')) issues.push({ path: `imageUses.${index}.src`, message: 'Imagem em base64 não pode ir para produção. Publique pela biblioteca de mídia.', severity: 'error' });
  });

  photos.forEach((photo, index) => {
    if (!photo.alt) issues.push({ path: `sitePhotos.${index}.alt`, message: `Foto "${photo.label || index + 1}" está sem alt text.`, severity: 'warning' });
    if (String(photo.src || '').startsWith('data:image/')) issues.push({ path: `sitePhotos.${index}.src`, message: 'Imagem em base64 não pode ir para produção. Publique pela biblioteca de mídia.', severity: 'error' });
    if (String(photo.risk || '').toLowerCase().includes('alto')) issues.push({ path: `sitePhotos.${index}.risk`, message: `Foto "${photo.label || index + 1}" tem risco alto. Revise antes de publicar.`, severity: 'warning' });
  });

  (input.publicPresence || []).forEach((item, index) => {
    try {
      if (item.url) new URL(String(item.url));
    } catch {
      issues.push({ path: `publicPresence.${index}.url`, message: `URL inválida em "${item.vehicle || index + 1}".`, severity: 'error' });
    }
  });

  return issues;
}
