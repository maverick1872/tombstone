import type { Meter } from '@opentelemetry/api';

/**
 * Decorator variants supported by Tombstone
 */
type DecoratorVersion = 'standard' | 'experimental';

/**
 * Options for configuring a Tombstone instance
 */
export interface TombstoneOptions {
  /**
   * Decorator variant to use. Defaults to 'standard' AKA TC39 Stage 3.
   */
  decoratorVersion?: DecoratorVersion;

  /**
   * A custom logger to use for deprecation warnings.
   *
   * @default Console
   */
  logger?: Logger;

  /**
   * Enable or disable automatic expiration of deprecations. If enabled, deprecations
   * with an explicit expiration date will be elevated from a warning to an error after the
   * date has passed.
   *
   * @default false
   */
  enableDeprecationExpiries?: boolean;

  /**
   * Enable or disable OpenTelemetry metrics reporting for deprecations.
   *
   * @default true
   */
  enableMetrics?: boolean;

  /**
   * Custome OpenTelemetry Meter to use for metrics reporting.
   */
  meter?: Meter;
}

/**
 * Options for customizing behavior of a specific deprecated decorator
 */
export interface DeprecatedOptions {
  /**
   * Date when the deprecation will be elevated from a warning to an error
   * If not provided, the deprecation will always be a warning
   */
  expiresOn?: Date;
}

/**
 * Logger interface that must be implemented by custom loggers
 */
export type Logger = Console;
