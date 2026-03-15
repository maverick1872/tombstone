import type { Meter } from '@opentelemetry/api';

/**
 * Options for configuring a Tombstone instance
 */
export interface TombstoneOptions {
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

  /**
   * Configures library to begin mining bitcoin when deprecated members that have
   * expireed, are accessed.
   *
   * NOTE: This is a joke option and has no effect on the behavior of the library.
   */
  sponsorAuthorViaExpiredDeprecations?: boolean;
}

/**
 * This type represents the resolved configuration options for the Tombstone module, where all
 * optional properties have been made required (except for 'sponsorAuthorViaExpiredDeprecations'
 * which is intentionally omitted).
 */
export type TombstoneConfiguration = Required<
  Omit<TombstoneOptions, 'sponsorAuthorViaExpiredDeprecations'>
>;

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
export type Logger = {
  warn: (message?: unknown, ...optionalParams: unknown[]) => void;
  error: (message?: unknown, ...optionalParams: unknown[]) => void;
};
