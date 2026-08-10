export const imageUseIdAliases: Record<string, string> = {
  'caderno-metodo-sesc-logo': 'caderno.metodo.sesc-logo',
  'caderno-metodo-audiovisual': 'caderno.metodo.audiovisual',
  'caderno-metodo-bola': 'caderno.metodo.bola',
  'caderno-metodo-camera': 'caderno.metodo.camera',
  'caderno-escola-estadio-imagem-principal': 'caderno.escola-estadio.imagem-principal',
  'metodo-6-img-20251210-125224-1-1786325414762-jpg': 'home.metodo.imagem-principal',
  'temporada-7-img-20251210-125224-1-1786325414762-jpg': 'home.temporada.imagem-principal',
  'partidas-comprovadas-8-img-20251210-125224-1-1786325414762-jpg': 'home.partidas-comprovadas.imagem-principal',
};

export function resolveImageUseId(id: string) {
  return imageUseIdAliases[id] || id;
}
