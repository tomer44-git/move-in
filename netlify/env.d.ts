/**
 * The one Node global these functions touch.
 *
 * Declared here rather than by adding @types/node, which would be a dependency
 * for a single name.
 */
declare const process: {
  env: Record<string, string | undefined>
}
