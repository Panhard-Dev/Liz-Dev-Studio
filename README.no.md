<p align="center">
  <picture>
    <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
    <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
    <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="LIZ AI BRASIL" width="360">
  </picture>
</p>

<h1 align="center">LIZ AI BRASIL</h1>

<p align="center">
  <strong>Liz Dev Studio</strong><br>
  CLI e aplicativo Desktop/EXE oficial da LIZ AI BRASIL.
</p>

<p align="center">
  <a href="https://github.com/Panhard-Dev/Liz-Dev-Studio">Repositorio oficial</a>
</p>

---

## Sobre

O Liz Dev Studio e o ambiente oficial da LIZ AI BRASIL para desenvolvimento com IA.

Este projeto reune:

- CLI oficial da LIZ AI BRASIL
- Aplicativo Desktop/EXE em Electron
- Autenticacao da conta LIZ AI BRASIL
- Persistencia de sessao e token
- Uso, limites, tokens e planos da conta Liz
- Modelos oficiais da Liz
- Sistema de skills
- Identidade visual preto/roxo da LIZ AI BRASIL

## Modelos Oficiais

A LIZ AI BRASIL trabalha com os modelos oficiais da Liz:

- Liz 2.3
- Liz 2.5 PRO
- Liz 2.6 PRO

Esses sao os nomes que devem aparecer para o usuario final dentro do app.

## Integracao Oficial

A integracao oficial dos modelos da LIZ AI BRASIL usa:

```txt
https://dockfile-liz.onrender.com/
```

Essa URL faz parte do fluxo oficial da Liz e deve ser preservada.

## Instalar A CLI

A CLI publica preparada por este projeto e:

```txt
liz-ai-brasil
```

Quando o pacote npm estiver publicado, instale com:

```bash
npm install -g liz-ai-brasil
```

Comandos disponiveis:

```bash
liz --version
liz-ai-brasil --version
```

## Rodar Localmente

Instalar dependencias:

```bash
bun install
```

Rodar a CLI:

```bash
bun run --cwd packages/liz dev
```

Rodar o Desktop Electron:

```bash
bun run dev:desktop
```

## Gerar EXE Windows

```powershell
cd packages/desktop-electron
$env:LIZ_CHANNEL="dev"
bun run build
bun run package:win
```

O instalador sera gerado em:

```txt
packages/desktop-electron/dist/Liz Dev Studio Setup.exe
```

## Gerar Linux

```bash
cd packages/desktop-electron
LIZ_CHANNEL=prod bun run package:linux
```

A configuracao do Electron Builder pode gerar AppImage, deb e rpm.

## Publicar A CLI No npm

```bash
cd packages/liz
bun run build
bun run publish:npm
```

Pacote preparado:

```txt
liz-ai-brasil
```

## Cuidados Do Projeto

- Nao quebrar a CLI para corrigir o Desktop.
- Nao remover modelos oficiais da Liz.
- Nao trocar a URL oficial dos modelos sem necessidade tecnica real.
- Nao alterar roteamento, provider ou sessao fora do escopo necessario.
- Preservar autenticacao, usage, tokens, planos e skills da LIZ AI BRASIL.
- Preservar a identidade visual preto/roxo da LIZ AI BRASIL.

## Repositorio

```txt
https://github.com/Panhard-Dev/Liz-Dev-Studio
```

---

<p align="center">
  <strong>LIZ AI BRASIL</strong><br>
  Liz Dev Studio
</p>
