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

export type CmsState = {
  publicPresence: PublicPresenceItem[];
  sitePhotos: SitePhoto[];
  photos?: SitePhoto[];
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

export function normalizeCmsState(input: Partial<CmsState>): CmsState {
  const publicPresence = Array.isArray(input.publicPresence) ? input.publicPresence.map(cleanPublicPresence) : [];
  const sourcePhotos = Array.isArray(input.sitePhotos) ? input.sitePhotos : Array.isArray(input.photos) ? input.photos : [];
  const sitePhotos = sourcePhotos.map(cleanSitePhoto);

  return {
    publicPresence,
    sitePhotos,
    photos: sitePhotos,
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
