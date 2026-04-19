export function isDevMode(): boolean {
  return process.env.GIT_IGNORE_DEV === 'true';
}
