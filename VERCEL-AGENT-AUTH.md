# Vercel Agent Auth

Autenticacao esperada para este agente:

- Variavel de ambiente: `VERCEL_TOKEN`
- Escopo: projeto Vercel vinculado em `.vercel/project.json`
- Modo proibido: login global interativo

Se `VERCEL_TOKEN` estiver ausente ou invalido, parar e pedir o token correto ao humano.
