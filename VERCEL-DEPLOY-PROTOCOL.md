# Vercel Deploy Protocol

Este projeto deve ser publicado sem usar login global da CLI.

## Regras

- Usar somente `scripts/vercel-safe-deploy.sh`.
- Nao executar `vercel login`, `vercel switch`, `vercel logout` nem `vercel deploy` direto.
- Exigir `VERCEL_TOKEN` no ambiente.
- Exigir `.vercel/project.json` com `projectId` e `orgId`.
- Rodar `npm run build` antes de publicar.
- Deploy de producao deve usar `--prod`.

## Comandos

```bash
scripts/vercel-safe-deploy.sh --check
scripts/vercel-safe-deploy.sh --deploy
```
