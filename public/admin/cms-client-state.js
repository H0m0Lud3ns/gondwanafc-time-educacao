window.GFC_CMS = window.GFC_CMS || {};

window.GFC_CMS.imageUseIdAliases = {
  'caderno-metodo-sesc-logo': 'caderno.metodo.sesc-logo',
  'caderno-metodo-audiovisual': 'caderno.metodo.audiovisual',
  'caderno-metodo-bola': 'caderno.metodo.bola',
  'caderno-metodo-camera': 'caderno.metodo.camera',
  'caderno-escola-estadio-imagem-principal': 'caderno.escola-estadio.imagem-principal',
  'metodo-6-img-20251210-125224-1-1786325414762-jpg': 'home.metodo.imagem-principal',
  'temporada-7-img-20251210-125224-1-1786325414762-jpg': 'home.temporada.imagem-principal',
  'partidas-comprovadas-8-img-20251210-125224-1-1786325414762-jpg': 'home.partidas-comprovadas.imagem-principal',
};

window.GFC_CMS.resolveImageUseId = function resolveImageUseId(id) {
  return window.GFC_CMS.imageUseIdAliases[id] || id;
};

window.GFC_CMS.buildPublishPayload = function buildPublishPayload(state, options = {}) {
  const sitePhotos = Array.isArray(state.sitePhotos) ? state.sitePhotos : Array.isArray(state.photos) ? state.photos : [];
  return {
    password: options.password,
    baseUpdatedAt: options.baseUpdatedAt || '',
    publicPresence: Array.isArray(state.publicPresence) ? state.publicPresence : [],
    sitePhotos,
    photos: sitePhotos,
    imageUses: Array.isArray(state.imageUses) ? state.imageUses : [],
    uploads: Array.isArray(state.uploads) ? state.uploads : [],
    home: state.home && typeof state.home === 'object' ? state.home : {},
    seo: state.seo && typeof state.seo === 'object' ? state.seo : {},
    projects: Array.isArray(state.projects) ? state.projects : [],
    links: Array.isArray(state.links) ? state.links : [],
    siteMap: Array.isArray(state.siteMap) ? state.siteMap : [],
  };
};

window.GFC_CMS.buildValidationPayload = function buildValidationPayload(state) {
  const payload = window.GFC_CMS.buildPublishPayload(state);
  delete payload.password;
  delete payload.baseUpdatedAt;
  return payload;
};
