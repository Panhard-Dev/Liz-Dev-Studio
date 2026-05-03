<p align="center">
  <picture>
    <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
    <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
    <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Liz AI Brasil" width="360">
  </picture>
</p>

<h1 align="center">Liz Dev Studio</h1>

<p align="center">
  App oficial da <strong>LIZ AI BRASIL</strong> para desenvolvimento com IA, com CLI e Desktop/EXE Electron no mesmo projeto.
</p>

<p align="center">
  <a href="https://github.com/Panhard-Dev/Liz-Dev-Studio">Repositorio oficial</a>
</p>

---

## LIZ AI BRASIL

Liz Dev Studio e o projeto oficial da LIZ AI BRASIL para usar a Liz no terminal e no aplicativo desktop.

O foco deste repositorio e manter a experiencia da Liz estavel em:

- CLI da LIZ AI BRASIL
- Desktop Electron/EXE da LIZ AI BRASIL
- autenticacao da conta LIZ AI BRASIL
- sessao/token persistente
- uso, tokens e planos da conta Liz
- modelos oficiais da Liz
- sistema de skills
- identidade visual preto/roxo da Liz

## Modelos Oficiais Da Liz

A interface da LIZ AI BRASIL deve mostrar os modelos oficiais:

- Liz 2.3
- Liz 2.5 PRO
- Liz 2.6 PRO

O usuario nao deve ver texto dizendo que a Liz e um pacote de modelos externos. A marca, a interface e a comunicacao devem ser da LIZ AI BRASIL.

## URL Oficial Dos Modelos

A URL oficial da integracao de modelos da Liz e:

```txt
https://dockfile-liz.onrender.com/
```

Essa integracao deve ser preservada. Nao remover, nao trocar e nao quebrar sem necessidade tecnica real.

## Instalar A CLI

Quando o pacote npm estiver publicado:

```bash
npm install -g liz-ai-brasil
```

Depois:

```bash
liz --version
liz-ai-brasil --version
```

## Rodar Localmente

Na raiz do projeto:

```bash
bun install
```

CLI:

```bash
bun run --cwd packages/liz dev
```

Desktop Electron:

```bash
bun run dev:desktop
```

## Gerar EXE Windows

```bash
cd packages/desktop-electron
$env:LIZ_CHANNEL="dev"
bun run build
bun run package:win
```

O instalador gerado fica em:

```txt
packages/desktop-electron/dist/Liz Dev Studio Setup.exe
```

## Gerar Linux

```bash
cd packages/desktop-electron
LIZ_CHANNEL=prod bun run package:linux
```

O Electron Builder pode gerar AppImage, deb e rpm conforme a configuracao do projeto.

## Publicar No npm

A publicacao npm da CLI usa:

```bash
cd packages/liz
bun run build
bun run publish:npm
```

O pacote publico preparado por este projeto e:

```txt
liz-ai-brasil
```

## Regras Importantes Do Projeto

- Nao quebrar a CLI para corrigir o Desktop.
- Nao remover modelos existentes sem necessidade real.
- Nao trocar a URL oficial dos modelos sem justificativa tecnica.
- Nao alterar roteamento/provider fora do escopo da correcao.
- Preservar autenticacao, usage, tokens, planos e skills da LIZ AI BRASIL.
- Preservar a identidade visual preto/roxo da Liz.

## Repositorio

Repositorio oficial publicado:

```txt
https://github.com/Panhard-Dev/Liz-Dev-Studio
```

---

LIZ AI BRASIL
