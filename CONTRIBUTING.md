# Contribuindo Com A LIZ AI BRASIL

Este repositorio e o projeto oficial da LIZ AI BRASIL / Liz Dev Studio.

## Antes De Alterar

- Preserve a URL oficial dos modelos: https://dockfile-liz.onrender.com/
- Preserve os modelos Liz 2.3, Liz 2.5 PRO e Liz 2.6 PRO.
- Nao quebre a CLI para corrigir o Desktop/EXE.
- Nao quebre o Desktop/EXE para corrigir a CLI.
- Nao remova funcionalidades importantes.
- Nao altere provider, auth, usage, tokens, planos ou skills sem necessidade tecnica real.

## Desenvolvimento

Instale dependencias:

```bash
bun install
```

Rode a CLI:

```bash
bun run --cwd packages/liz dev
```

Rode o Desktop Electron:

```bash
bun run dev:desktop
```

## Testes E Typecheck

Os testes nao devem ser rodados da raiz quando o pacote tiver guard contra isso. Entre no pacote necessario e rode o comando local.

Para typecheck, use:

```bash
bun typecheck
```

## Repositorio Oficial

https://github.com/Panhard-Dev/Liz-Dev-Studio
