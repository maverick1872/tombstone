// biome-ignore-all lint/suspicious/noExplicitAny: decorators are inherently any

import { type Meter, metrics } from '@opentelemetry/api';
import type { Logger } from './tombstone.types.js';
import type { ExpirmentalDecorators } from './decorator.types.js';

type DecoratorContext =
  | ClassDecoratorContext
  | ClassMethodDecoratorContext
  | ClassMemberDecoratorContext;

type DecoratorVersion = 'standard' | 'experimental';

type TombstoneConfiguration = {
  decoratorVersion?: DecoratorVersion;
  logger?: Logger;
  meter?: Meter;
  /**
   * Enable or disable all deprecation warnings globally
   */
  enableWarnings?: boolean;

  /**
   * Enable or disable error elevation for expired deprecations
   */
  enableErrorElevation?: boolean;

  /**
   * Enable or disable metrics collection for deprecation tracking
   */
  enableMetrics?: boolean;
};

/**
 * A class providing factory methods to create deprecation decorators
 * for classes, methods, and properties.
 */
export class Tombstone {
  // #meter: Meter;
  #logger: Logger;
  #decoratorVersion: DecoratorVersion;

  /**
   * Creates a new Tombstone instance with optional custom logger and meter
   *
   * @param configuration Configuration options for the Tombstone instance
   */
  constructor(configuration: TombstoneConfiguration = {}) {
    this.#logger = configuration.logger ?? console;
    this.#decoratorVersion = configuration.decoratorVersion ?? 'standard';
    this.#logger.log('Tombstone initialized');
    // this.#meter =
    //   configuration.meter || metrics.getMeter("@maverick1872/tombstone");
  }

  public Deprecate(): any {
    if (this.#decoratorVersion === 'standard')
      return this.#constructStandardDecorator();

    if (this.#decoratorVersion === 'experimental')
      return this.#constructExperimentalDecorator();

    throw new Error('Invalid decorator version specified');
  }

  #constructStandardDecorator() {
    return (target: any, context?: DecoratorContext): any => {
      if (this.#isClassContext(context)) {
        return this.#constructClassDecorator(target, context);
      }

      if (this.#isMethodContext(context)) {
        return this.#constructMethodDecorator(target, context);
      }

      if (this.#isFieldContext(context)) {
        return this.#constructFieldInitializerDecorator(target, context);
      }

      if (this.#isAccessorContect(context)) {
        return this.#constructAccessorDecorator(target, context);
      }

      if (this.#isSetterContext(context)) {
        return this.#constructSetterDecorator(target, context);
      }

      if (this.#isGetterContext(context)) {
        return this.#constructGetterDecorator(target, context);
      }

      this.#logger.error(
        'Deprecated decorator encountered an unsupported context',
        context,
      );
      return () => {};
    };
  }

  #constructExperimentalDecorator() {
    const logger = this.#logger;
    return (
      target: any,
      propertyKey?: string | symbol,
      descriptor?: TypedPropertyDescriptor<unknown>,
    ) => {
      if (propertyKey === undefined && descriptor === undefined) {
        return this.#constructClassDecorator(target, undefined);
      }

      if (propertyKey && descriptor === undefined) {
        throw new Error('Not Implemented');
        // throw new Error('Not Implemented');
        // return this.#constructExperimentalPropertyDecorator(
        //   target,
        //   propertyKey,
        // );
      }

      if (propertyKey && descriptor) {
        if (descriptor.value) {
          const methodName = propertyKey;
          const method: any = descriptor.value;

          descriptor.value = function (...args: unknown[]) {
            logger.warn(
              `Deprecated method '${methodName.toString()}' was invoked`,
            );
            return method.apply(this, args);
          };
          return descriptor;
        }

        if (descriptor.get || descriptor.set) {
          return this.#constructAccessorDecorator(
            {
              get: descriptor.get,
              set: descriptor.set,
            } as ClassAccessorDecoratorTarget<unknown, unknown>,
            {
              name: propertyKey.toString(),
            },
          );
        }
      }
    };
  }

  #isMethodContext(
    context: DecoratorContext | undefined,
  ): context is ClassMethodDecoratorContext {
    return !!context && context.kind === 'method';
  }

  #isFieldContext(
    context: DecoratorContext | undefined,
  ): context is ClassFieldDecoratorContext {
    return !!context && context.kind === 'field';
  }

  #isAccessorContect(
    context: DecoratorContext | undefined,
  ): context is ClassAccessorDecoratorContext {
    return !!context && context.kind === 'accessor';
  }

  #isSetterContext(
    context: DecoratorContext | undefined,
  ): context is ClassSetterDecoratorContext {
    return !!context && context.kind === 'setter';
  }

  #isGetterContext(
    context: DecoratorContext | undefined,
  ): context is ClassGetterDecoratorContext {
    return !!context && context.kind === 'getter';
  }

  #isClassContext(
    context: DecoratorContext | undefined,
  ): context is ClassDecoratorContext {
    return !!context && context.kind === 'class';
  }

  #constructClassDecorator(target: any, _context?: ClassDecoratorContext) {
    const logger = this.#logger;

    return class extends target {
      constructor(...args: unknown[]) {
        super(...args);
        let deprecationMessage = `Deprecated class of '${target.name}' was instantiated.`;
        if (
          this.constructor.name !== '' &&
          target.name !== this.constructor.name
        ) {
          deprecationMessage = `Subclass (${this.constructor.name}) of deprecated class (${target.name}) was instantiated.`;
        }
        logger.warn(deprecationMessage);
      }
    };
  }

  #constructMethodDecorator(
    target: any,
    context: Pick<ClassMethodDecoratorContext, 'name'>,
  ) {
    const logger = this.#logger;
    return function (this: unknown, ...args: unknown[]) {
      logger.warn(`Deprecated method '${context.name.toString()}' was invoked`);
      return target.call(this, ...args);
    };
  }

  #constructAccessorDecorator(
    target: ClassAccessorDecoratorTarget<unknown, unknown>,
    context: Pick<ClassAccessorDecoratorContext, 'name'>,
  ) {
    const logger = this.#logger;
    const originalGetter = target.get;
    const originalSetter = target.set;

    return {
      get(this: unknown) {
        logger.warn(
          `Deprecated property '${context.name.toString()}' was accessed`,
        );
        return originalGetter.call(this);
      },
      set(this: unknown, val: unknown) {
        logger.warn(`Deprecated property '${context.name.toString()}' was set`);
        return originalSetter.call(this, val);
      },
    };
  }

  #constructSetterDecorator(
    target: any,
    context: Pick<ClassSetterDecoratorContext, 'name'>,
  ) {
    const logger = this.#logger;
    return function (this: unknown, ...args: unknown[]) {
      logger.warn(`Deprecated property '${context.name.toString()}' was set`);
      return target.call(this, ...args);
    };
  }

  #constructGetterDecorator(
    target: any,
    context: Pick<ClassGetterDecoratorContext, 'name'>,
  ) {
    const logger = this.#logger;
    return function (this: unknown, ...args: unknown[]) {
      logger.warn(
        `Deprecated property '${context.name.toString()}' was accessed`,
      );
      return target.call(this, ...args);
    };
  }

  #constructFieldInitializerDecorator(
    _target: undefined,
    context: Pick<ClassFieldDecoratorContext, 'name'>,
  ) {
    const logger = this.#logger;
    return (initialValue: unknown) => {
      logger.warn(
        `Deprecated property '${context.name.toString()}' was initialized`,
      );
      return initialValue;
    };
  }
}
