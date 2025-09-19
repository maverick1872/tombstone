// biome-ignore-all lint/suspicious/noExplicitAny: decorators are inherently any
import { type Counter, type Meter, metrics } from '@opentelemetry/api';
import type { Logger, TombstoneOptions } from './tombstone.types.js';

type DecoratorContext =
  | ClassDecoratorContext
  | ClassMethodDecoratorContext
  | ClassMemberDecoratorContext;

/**
 * A class providing factory methods to create deprecation decorators
 * for classes, methods, and properties.
 */
export class Tombstone {
  #config: TombstoneOptions;
  #logger: Logger;
  #meter: Meter;
  #deprecationCounter: Counter;

  /**
   * Creates a new Tombstone instance with optional custom logger and meter
   *
   * @param opts Configuration options for the Tombstone instance
   */
  constructor(opts: TombstoneOptions = {}) {
    // Persist configuration values and apply defaults as necessary
    this.#config = {
      decoratorVersion: opts.decoratorVersion ?? 'standard',
      enableMetrics: opts.enableMetrics ?? true,
      enableDeprecationExpiries: opts.enableDeprecationExpiries ?? false,
    };

    // Set up logger
    this.#logger = opts.logger ?? console;

    // Set up OpenTelemetry Meter and instruments
    this.#meter = opts.meter ?? metrics.getMeter('@maverick1872/tombstone');
    this.#deprecationCounter = this.#meter.createCounter('tombstones', {
      description: 'Counts the number of tombstones encountered',
    });
  }

  public Deprecate(): any {
    if (this.#config.decoratorVersion === 'standard')
      return this.#constructStandardDecorator();

    if (this.#config.decoratorVersion === 'experimental')
      return this.#constructExperimentalDecorator();

    throw new Error('Invalid decorator version specified');
  }

  #constructStandardDecorator() {
    return (target: any, context?: DecoratorContext): any => {
      switch (context?.kind) {
        case 'class':
          return this.#constructClassDecorator(target, context);
        case 'method':
          return this.#constructMethodDecorator(target, context);
        case 'field':
          this.#logger.error('Field decorators are not yet supported');
          return () => {};
        case 'accessor':
          return this.#constructAccessorDecorator(target, context);
        case 'setter':
          return this.#constructSetterDecorator(target, context);
        case 'getter':
          return this.#constructGetterDecorator(target, context);
        default: {
          // Exhaustiveness guard for future context kinds
          const _never: never = context as never;
          this.#logger.error(
            'Deprecated decorator encountered an unknown context kind',
            _never,
          );
          return () => {};
        }
      }
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
        return;
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

      return;
    };
  }

  #constructClassDecorator(target: any, _context?: ClassDecoratorContext) {
    const logDeprecationNotice = this.#logClassDeprecationNotice.bind(this);

    return class extends target {
      constructor(...args: unknown[]) {
        super(...args);
        // In some transpilation scenarios the subclass may have an empty name ('')
        // Fallback to the original target name so tests expecting the original
        // class name still pass.
        const subclassName = this.constructor.name || target.name;
        const parentClass =
          subclassName !== target.name && target.name !== ''
            ? target.name
            : undefined;
        logDeprecationNotice(subclassName, parentClass);
      }
    };
  }

  #constructMethodDecorator(
    target: any,
    context: Pick<ClassMethodDecoratorContext, 'name'>,
  ) {
    const methodName = context.name.toString();
    const logDeprecationNotice =
      this.#logMethodInvocationDeprecationNotice.bind(this);

    return function (this: unknown, ...args: unknown[]) {
      logDeprecationNotice(methodName);
      return target.call(this, ...args);
    };
  }

  #constructAccessorDecorator(
    target: ClassAccessorDecoratorTarget<unknown, unknown>,
    context: Pick<ClassAccessorDecoratorContext, 'name'>,
  ) {
    const propertyName = context.name.toString();
    const logGetDeprecationNotice =
      this.#logPropertyAccessDeprecationNotice.bind(this);
    const logSetDeprecationNotice =
      this.#logPropertySetDeprecationNotice.bind(this);
    const originalGetter = target.get;
    const originalSetter = target.set;

    const result: Partial<ClassAccessorDecoratorTarget<unknown, unknown>> = {};
    if (typeof originalGetter === 'function') {
      result.get = function (this: unknown) {
        logGetDeprecationNotice(propertyName);
        return originalGetter.call(this);
      };
    }

    if (typeof originalSetter === 'function') {
      result.set = function (this: unknown, val: unknown) {
        logSetDeprecationNotice(propertyName);
        return originalSetter.call(this, val);
      };
    }

    return result;
  }

  #constructSetterDecorator(
    target: any,
    context: Pick<ClassSetterDecoratorContext, 'name'>,
  ) {
    const propertyName = context.name.toString();
    const logDeprecationNotice =
      this.#logPropertySetDeprecationNotice.bind(this);

    return function (this: unknown, ...args: unknown[]) {
      logDeprecationNotice(propertyName);
      return target.call(this, ...args);
    };
  }

  #constructGetterDecorator(
    target: any,
    context: Pick<ClassGetterDecoratorContext, 'name'>,
  ) {
    const propertyName = context.name.toString();
    const logDeprecationNotice =
      this.#logPropertyAccessDeprecationNotice.bind(this);

    return function (this: unknown, ...args: unknown[]) {
      logDeprecationNotice(propertyName);
      return target.call(this, ...args);
    };
  }

  #logPropertyAccessDeprecationNotice(propertyName: string | symbol) {
    this.#logDeprecationNotice(
      `Deprecated property '${propertyName.toString()}' was accessed`,
    );
  }

  #logPropertySetDeprecationNotice(propertyName: string | symbol) {
    this.#logDeprecationNotice(
      `Deprecated property '${propertyName.toString()}' was set`,
    );
  }

  #logMethodInvocationDeprecationNotice(methodName: string | symbol) {
    this.#logDeprecationNotice(
      `Deprecated method '${methodName.toString()}' was invoked`,
    );
    this.#deprecationCounter.add(1, { type: 'method' });
  }

  #logClassDeprecationNotice(className: string, parentClassName?: string) {
    if (parentClassName) {
      this.#logDeprecationNotice(
        `Subclass (${className}) of deprecated class (${parentClassName}) was instantiated.`,
      );
    } else {
      this.#logDeprecationNotice(
        `Deprecated class of '${className}' was instantiated.`,
      );
    }
  }

  #logDeprecationNotice(message: string) {
    this.#logger.warn(message);
  }
}
