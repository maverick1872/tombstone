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
 * Configuration options for deprecation settings
 */
export interface DeprecationConfig {
  /**
   * Enable or disable all deprecation warnings globally
   */
  enableWarnings: boolean;

  /**
   * Enable or disable error elevation for expired deprecations
   */
  enableErrorElevation: boolean;

  /**
   * Enable or disable metrics collection for deprecation tracking
   */
  enableMetrics: boolean;
}

/**
 * Default configuration for the deprecation system
 */
export const DEFAULT_CONFIG: DeprecationConfig = {
  enableWarnings: true,
  enableErrorElevation: true,
  enableMetrics: true,
};

/**
 * Logger interface that must be implemented by custom loggers
 */
export type Logger = Console;
