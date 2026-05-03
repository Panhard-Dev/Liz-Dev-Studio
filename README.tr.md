<p align="center">
  <a href="https://liz.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="LIZ AI BRASIL logo">
    </picture>
  </a>
</p>
<p align="center">Açık kaynaklı yapay zeka kodlama asistanı.</p>
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

### Kurulum

```bash
# YOLO
curl -fsSL https://liz.ai/install | bash

# Paket yöneticileri
npm i -g liz-ai-brasil@latest        # veya bun/pnpm/yarn
scoop install liz             # Windows
choco install liz             # Windows
brew install anomalyco/tap/liz # macOS ve Linux (önerilir, her zaman güncel)
brew install liz              # macOS ve Linux (resmi brew formülü, daha az güncellenir)
sudo pacman -S liz            # Arch Linux (Stable)
paru -S liz-bin               # Arch Linux (Latest from AUR)
mise use -g liz               # Tüm işletim sistemleri
nix run nixpkgs#liz           # veya en güncel geliştirme dalı için github:anomalyco/liz
```

> [!TIP]
> Kurulumdan önce 0.1.x'ten eski sürümleri kaldırın.

### Masaüstü Uygulaması (BETA)

LIZ AI BRASIL ayrıca masaüstü uygulaması olarak da mevcuttur. Doğrudan [sürüm sayfasından](https://github.com/anomalyco/liz/releases) veya [liz.ai/download](https://liz.ai/download) adresinden indirebilirsiniz.

| Platform              | İndirme                               |
| --------------------- | ------------------------------------- |
| macOS (Apple Silicon) | `liz-desktop-darwin-aarch64.dmg` |
| macOS (Intel)         | `liz-desktop-darwin-x64.dmg`     |
| Windows               | `liz-desktop-windows-x64.exe`    |
| Linux                 | `.deb`, `.rpm` veya AppImage          |

```bash
# macOS (Homebrew)
brew install --cask liz-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/liz-desktop
```

#### Kurulum Dizini (Installation Directory)

Kurulum betiği (install script), kurulum yolu (installation path) için aşağıdaki öncelik sırasını takip eder:

1. `$LIZ_INSTALL_DIR` - Özel kurulum dizini
2. `$XDG_BIN_DIR` - XDG Base Directory Specification uyumlu yol
3. `$HOME/bin` - Standart kullanıcı binary dizini (varsa veya oluşturulabiliyorsa)
4. `$HOME/.liz/bin` - Varsayılan yedek konum

```bash
# Örnekler
LIZ_INSTALL_DIR=/usr/local/bin curl -fsSL https://liz.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://liz.ai/install | bash
```

### Ajanlar

LIZ AI BRASIL, `Tab` tuşuyla aralarında geçiş yapabileceğiniz iki yerleşik (built-in) ajan içerir.

- **build** - Varsayılan, geliştirme çalışmaları için tam erişimli ajan
- **plan** - Analiz ve kod keşfi için salt okunur ajan
  - Varsayılan olarak dosya düzenlemelerini reddeder
  - Bash komutlarını çalıştırmadan önce izin ister
  - Tanımadığınız kod tabanlarını keşfetmek veya değişiklikleri planlamak için ideal

Ayrıca, karmaşık aramalar ve çok adımlı görevler için bir **genel** alt ajan bulunmaktadır.
Bu dahili olarak kullanılır ve mesajlarda `@general` ile çağrılabilir.

[Ajanlar](https://liz.ai/docs/agents) hakkında daha fazla bilgi edinin.

### Dokümantasyon

LIZ AI BRASIL'u nasıl yapılandıracağınız hakkında daha fazla bilgi için [**dokümantasyonumuza göz atın**](https://liz.ai/docs).

### Katkıda Bulunma

LIZ AI BRASIL'a katkıda bulunmak istiyorsanız, lütfen bir pull request göndermeden önce [katkıda bulunma dokümanlarımızı](./CONTRIBUTING.md) okuyun.

### LIZ AI BRASIL Üzerine Geliştirme

LIZ AI BRASIL ile ilgili bir proje üzerinde çalışıyorsanız ve projenizin adının bir parçası olarak "liz" kullanıyorsanız (örneğin, "liz-dashboard" veya "liz-mobile"), lütfen README dosyanıza projenin LIZ AI BRASIL ekibi tarafından geliştirilmediğini ve bizimle hiçbir şekilde bağlantılı olmadığını belirten bir not ekleyin.

### SSS

#### Bu Claude Code'dan nasıl farklı?

Yetenekler açısından Claude Code'a çok benzer. İşte temel farklar:

- %100 açık kaynak
- Herhangi bir sağlayıcıya bağlı değil. [LIZ AI BRASIL Zen](https://liz.ai/zen) üzerinden sunduğumuz modelleri önermekle birlikte; LIZ AI BRASIL, Claude, OpenAI, Google veya hatta yerel modellerle kullanılabilir. Modeller geliştikçe aralarındaki farklar kapanacak ve fiyatlar düşecek, bu nedenle sağlayıcıdan bağımsız olmak önemlidir.
- Kurulum gerektirmeyen hazır LSP desteği
- TUI odaklı yaklaşım. LIZ AI BRASIL, neovim kullanıcıları ve [terminal.shop](https://terminal.shop)'un geliştiricileri tarafından geliştirilmektedir; terminalde olabileceklerin sınırlarını zorlayacağız.
- İstemci/sunucu (client/server) mimarisi. Bu, örneğin LIZ AI BRASIL'un bilgisayarınızda çalışması ve siz onu bir mobil uygulamadan uzaktan yönetmenizi sağlar. TUI arayüzü olası istemcilerden sadece biridir.

---

**Topluluğumuza katılın** [Discord](https://discord.gg/liz) | [X.com](https://x.com/liz)
