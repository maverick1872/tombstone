export type Constructable<T = unknown> = new (...args: unknown[]) => T;
/**
 * Options for customizing deprecated decorator behavior
 */
export interface DeprecatedOptions {
  /**
   * Date when the deprecation will be elevated from a warning to an error
   * If not provided, the deprecation will always be a warning
   */
  expiresOn?: Date;

  /**
   * Custom message to add to the deprecation warning/error
   */
  message?: string;
}

/**
 * Logger interface that must be implemented by custom loggers
 */
export type Logger = Console;
