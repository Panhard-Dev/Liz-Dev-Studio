declare global {
  const LIZ_VERSION: string
  const LIZ_CHANNEL: string
}

export const InstallationVersion = typeof LIZ_VERSION === "string" ? LIZ_VERSION : "local"
export const InstallationChannel = typeof LIZ_CHANNEL === "string" ? LIZ_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
