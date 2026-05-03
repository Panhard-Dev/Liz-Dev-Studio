<p align="center">
  <a href="https://liz.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="Logo do LIZ AI BRASIL">
    </picture>
  </a>
</p>
<p align="center">O agente de programação com IA de código aberto.</p>
<p align="center">
  <a href="https://liz.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/liz-ai-brasil"><img alt="npm" src="https://img.shields.io/npm/v/liz-ai-brasil?style=flat-square" /></a>
  <a href="https://github.com/anomalyco/liz/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/anomalyco/liz/publish.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![LIZ AI BRASIL Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://liz.ai)

---

### Instalação

```bash
# YOLO
curl -fsSL https://liz.ai/install | bash

# Gerenciadores de pacotes
npm i -g liz-ai-brasil@latest        # ou bun/pnpm/yarn
scoop install liz             # Windows
choco install liz             # Windows
brew install anomalyco/tap/liz # macOS e Linux (recomendado, sempre atualizado)
brew install liz              # macOS e Linux (fórmula oficial do brew, atualiza menos)
sudo pacman -S liz            # Arch Linux (Stable)
paru -S liz-bin               # Arch Linux (Latest from AUR)
mise use -g liz               # qualquer sistema
nix run nixpkgs#liz           # ou github:anomalyco/liz para a branch dev mais recente
```

> [!TIP]
> Remova versões anteriores a 0.1.x antes de instalar.

### App desktop (BETA)

O LIZ AI BRASIL também está disponível como aplicativo desktop. Baixe diretamente pela [página de releases](https://github.com/anomalyco/liz/releases) ou em [liz.ai/download](https://liz.ai/download).

| Plataforma            | Download                              |
| --------------------- | ------------------------------------- |
| macOS (Apple Silicon) | `liz-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `liz-desktop-darwin-x64.dmg`     |
| Windows               | `liz-desktop-windows-x64.exe`    |
| Linux                 | `.deb`, `.rpm` ou AppImage            |

```bash
# macOS (Homebrew)
brew install --cask liz-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/liz-desktop
```

#### Diretório de instalação

O script de instalação respeita a seguinte ordem de prioridade para o caminho de instalação:

1. `$LIZ_INSTALL_DIR` - Diretório de instalação personalizado
2. `$XDG_BIN_DIR` - Caminho compatível com a especificação XDG Base Directory
3. `$HOME/bin` - Diretório binário padrão do usuário (se existir ou puder ser criado)
4. `$HOME/.liz/bin` - Fallback padrão

```bash
# Exemplos
LIZ_INSTALL_DIR=/usr/local/bin curl -fsSL https://liz.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://liz.ai/install | bash
```

### Agents

O LIZ AI BRASIL inclui dois agents integrados, que você pode alternar com a tecla `Tab`.

- **build** - Padrão, agent com acesso total para trabalho de desenvolvimento
- **plan** - Agent somente leitura para análise e exploração de código
  - Nega edições de arquivos por padrão
  - Pede permissão antes de executar comandos bash
  - Ideal para explorar codebases desconhecidas ou planejar mudanças

Também há um subagent **general** para buscas complexas e tarefas em várias etapas.
Ele é usado internamente e pode ser invocado com `@general` nas mensagens.

Saiba mais sobre [agents](https://liz.ai/docs/agents).

### Documentação

Para mais informações sobre como configurar o LIZ AI BRASIL, [**veja nossa documentação**](https://liz.ai/docs).

### Contribuir

Se você tem interesse em contribuir com o LIZ AI BRASIL, leia os [contributing docs](./CONTRIBUTING.md) antes de enviar um pull request.

### Construindo com LIZ AI BRASIL

Se você estiver trabalhando em um projeto relacionado ao LIZ AI BRASIL e estiver usando "liz" como parte do nome (por exemplo, "liz-dashboard" ou "liz-mobile"), adicione uma nota no README para deixar claro que não foi construído pela equipe do LIZ AI BRASIL e não é afiliado a nós de nenhuma forma.

### FAQ

#### Como isso é diferente do Claude Code?

É muito parecido com o Claude Code em termos de capacidade. Aqui estão as principais diferenças:

- 100% open source
- Não está acoplado a nenhum provedor. Embora recomendemos os modelos que oferecemos pelo [LIZ AI BRASIL Zen](https://liz.ai/zen); o LIZ AI BRASIL pode ser usado com Claude, OpenAI, Google ou até modelos locais. À medida que os modelos evoluem, as diferenças diminuem e os preços caem, então ser provider-agnostic é importante.
- Suporte a LSP pronto para uso
- Foco em TUI. O LIZ AI BRASIL é construído por usuários de neovim e pelos criadores do [terminal.shop](https://terminal.shop); vamos levar ao limite o que é possível no terminal.
- Arquitetura cliente/servidor. Isso, por exemplo, permite executar o LIZ AI BRASIL no seu computador enquanto você o controla remotamente por um aplicativo mobile. Isso significa que o frontend TUI é apenas um dos possíveis clientes.

---

**Junte-se à nossa comunidade** [Discord](https://discord.gg/liz) | [X.com](https://x.com/liz)
