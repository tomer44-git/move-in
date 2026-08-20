/**
 * The Node globals the Vite config touches, declared rather than pulled in with
 * @types/node for two names.
 */
declare const process: {
  env: Record<string, string | undefined>
  cwd(): string
}
