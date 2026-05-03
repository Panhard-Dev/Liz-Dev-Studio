const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://liz.ai" : `https://${stage}.liz.ai`,
  console: stage === "production" ? "https://liz.ai/auth" : `https://${stage}.liz.ai/auth`,
  email: "contact@anoma.ly",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/anomalyco/liz",
  discord: "https://liz.ai/discord",
  headerLinks: [
    { name: "app.header.home", url: "/" },
    { name: "app.header.docs", url: "/docs/" },
  ],
}
