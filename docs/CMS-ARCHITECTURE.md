# CMS Gondwana FC - Arquitetura editorial

## Tese

O CMS deve organizar o site por lugares editoriais, nao por arquivos soltos.

Uma imagem no painel nao e apenas um arquivo. Ela e um uso conectado a uma pagina, uma secao e uma intencao editorial. O editor deve mostrar "Home > Metodo ABC > Imagem principal" antes de mostrar o nome tecnico do arquivo.

## Problema corrigido nesta fase

O painel tinha uma interface maior que o contrato real de publicacao. Ele mostrava areas como home, SEO, projetos, links e mapa do site, mas o schema de publicacao persistia principalmente presenca publica, fotos, usos de imagem e uploads.

Isso gerava duvida: algumas mudancas pareciam editaveis, mas nao tinham garantia estrutural de entrar no estado publicado.

## Modelo vigente

O estado publicado em `src/data/cms-state.json` passa a declarar:

- `schemaVersion`: versao do contrato editorial.
- `publicPresence`: registros de presenca publica.
- `sitePhotos` e `photos`: compatibilidade com a base anterior de imagens.
- `imageUses`: slots editoriais estaveis usados pelo site.
- `uploads`: arquivos publicados pela biblioteca de midia.
- `assets`: biblioteca derivada, agrupando imagens por `src` e indicando onde sao usadas.
- `home`, `seo`, `projects`, `links`, `siteMap`: campos persistidos para evoluir o CMS sem criar falsas promessas.

## Regra editorial de imagem

Fluxo correto:

1. O site declara um slot com `data-cms-use` e `imageUseFor()`.
2. O CMS mostra esse slot por pagina e secao.
3. O editor escolhe um asset ou sobe um novo arquivo.
4. O slot guarda o `src` aplicado, com `alt`, pagina, secao e fallback original.
5. A publicacao valida e persiste o estado.

## Principios

- Slots tem IDs estaveis com ponto: `home.metodo.imagem-principal`.
- Assets sao biblioteca. Image uses sao lugares editoriais.
- O editor visual e apoio. A aba `Usos das imagens` e a fonte operacional mais confiavel.
- Aliases e migracoes devem sair da UI e virar migracoes versionadas.
- Nenhuma nova area editavel deve aparecer no painel antes de estar no schema, no validador e no fluxo de publicacao.

## Proximas fases recomendadas

1. Extrair normalizacao de rascunho para modulo compartilhado entre `admin.astro` e `admin/visual.astro`.
2. Criar `src/lib/cms-migrations.ts` para remover aliases hardcoded das telas.
3. Fazer `cms-images.ts` resolver no formato futuro `imageUse -> asset`, mantendo fallback atual por `src`.
4. Transformar `siteMap` em mapa real de paginas e secoes, derivado dos slots e colecoes.
5. Marcar visualmente quais campos editam producao hoje e quais sao preparacao editorial.
