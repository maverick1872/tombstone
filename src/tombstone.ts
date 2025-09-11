// biome-ignore-all lint/suspicious/noExplicitAny: decorators are inherently any

// import { type Meter, metrics } from "@opentelemetry/api";
import type { DeprecationConfig, Logger } from './tombstone.types.js';

type DecoratorContext =
  | ClassDecoratorContext
  | ClassMethodDecoratorContext
  | ClassMemberDecoratorContext;

/**
 * A class providing factory methods to create deprecation decorators
 * for classes, methods, and properties.
 */
export class Tombstone {
  // #meter: Meter;
  #logger: Logger;

  /**
   * Creates a new Tombstone instance with optional custom logger and meter
   *
   * @param configuration Configuration options for the Tombstone instance
   */
  constructor(
    configuration: {
      logger?: Logger;
      meter?: import('@opentelemetry/api').Meter;
      config?: Partial<DeprecationConfig>;
    } = {},
  ) {
    this.#logger = configuration.logger ?? console;
    this.#logger.log('Tombstone initialized');
    // this.#meter =
    //   configuration.meter || metrics.getMeter("@maverick1872/tombstone");
  }

  public Deprecate() {
    const decorator = (target: any, context?: DecoratorContext): any => {
      if (this.#isClassDecorator(context)) {
        return this.#deprecateClass(target, context);
      }

      if (this.#isMethodDecorator(context)) {
        return this.#deprecateMethod(target, context);
      }

      if (this.#isFieldDecorator(context)) {
        return this.#deprecateFieldInitializer(target, context);
      }

      if (this.#isAccessorDecorator(context)) {
        return this.#deprecateAccessor(target, context);
      }

      if (this.#isSetterDecorator(context)) {
        return this.#deprecateSetter(target, context);
      }

      if (this.#isGetterDecorator(context)) {
        return this.#deprecateGetter(target, context);
      }

      this.#logger.error(
        'Deprecated decorator was applied on an unsupported context',
        context,
      );
    };

    return decorator;
  }

  #isMethodDecorator(
    context: DecoratorContext | undefined,
  ): context is ClassMethodDecoratorContext {
    return !!context && context.kind === 'method';
  }

  #isFieldDecorator(
    context: DecoratorContext | undefined,
  ): context is ClassFieldDecoratorContext {
    return !!context && context.kind === 'field';
  }

  #isAccessorDecorator(
    context: DecoratorContext | undefined,
  ): context is ClassAccessorDecoratorContext {
    return !!context && context.kind === 'accessor';
  }

  #isSetterDecorator(
    context: DecoratorContext | undefined,
  ): context is ClassSetterDecoratorContext {
    return !!context && context.kind === 'setter';
  }

  #isGetterDecorator(
    context: DecoratorContext | undefined,
  ): context is ClassGetterDecoratorContext {
    return !!context && context.kind === 'getter';
  }

  #isClassDecorator(
    context: DecoratorContext | undefined,
  ): context is ClassDecoratorContext {
    return !!context && context.kind === 'class';
  }

  #deprecateClass(target: any, _context?: ClassDecoratorContext) {
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

  #deprecateMethod(_target: any, context: ClassMethodDecoratorContext) {
    const logger = this.#logger;
    return function (this: unknown, ...args: unknown[]) {
      logger.warn(`Deprecated method '${context.name.toString()}' was invoked`);
      return _target.call(this, ...args);
    };
  }

  #deprecateAccessor(
    target: ClassAccessorDecoratorTarget<unknown, unknown>,
    context: ClassAccessorDecoratorContext,
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

  #deprecateSetter(target: any, context: ClassSetterDecoratorContext) {
    const logger = this.#logger;
    return function (this: unknown, ...args: unknown[]) {
      logger.warn(`Deprecated property '${context.name.toString()}' was set`);
      return target.call(this, ...args);
    };
  }

  #deprecateGetter(target: any, context: ClassGetterDecoratorContext) {
    const logger = this.#logger;
    return function (this: unknown, ...args: unknown[]) {
      logger.warn(
        `Deprecated property '${context.name.toString()}' was accessed`,
      );
      return target.call(this, ...args);
    };
  }

  #deprecateFieldInitializer(
    _target: undefined,
    context: ClassFieldDecoratorContext,
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
