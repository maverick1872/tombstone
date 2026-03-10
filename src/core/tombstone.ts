// biome-ignore-all lint/suspicious/noExplicitAny: decorators are inherently any
import { type Meter, metrics } from '@opentelemetry/api';
import type { TombstoneOptions } from './tombstone.types.js';
import type {
  DeprecationAttributes,
  DeprecationCounter,
} from './tombstone-metrics.types.js';

type ResolvedConfig = Required<
  Pick<
    TombstoneOptions,
    'logger' | 'enableMetrics' | 'enableDeprecationExpiries'
  >
> & { meter: Meter };

let counter: DeprecationCounter | undefined;

let config: ResolvedConfig = {
  logger: console,
  meter: metrics.getMeter('@maverick1872/tombstone'),
  enableMetrics: true,
  enableDeprecationExpiries: false,
};

/**
 * Configures the tombstone module with the provided options. This function should be called
 * before using any other functionality of the module to ensure that the configuration is applied correctly.
 */
export function configure(opts: TombstoneOptions): void {
  config = {
    logger: opts.logger ?? config.logger,
    meter: opts.meter ?? config.meter,
    enableMetrics: opts.enableMetrics ?? config.enableMetrics,
    enableDeprecationExpiries:
      opts.enableDeprecationExpiries ?? config.enableDeprecationExpiries,
  };

  if (opts.meter) {
    counter = undefined;
  }
}

/**
 * Module internal function to retrieve the current configuration.
 * This can be used by other functions within the module to access configuration options such as the logger and meter.
 */
export function getConfig(): ResolvedConfig {
  return config;
}

/**
 * Retrieves the deprecation counter metric. This function ensures that the counter is only created
 * once and reused for subsequent calls. The counter is used to track the number of times deprecated
 * members are accessed or invoked, and it is configured with appropriate labels to provide insights
 * into the usage of deprecated features.
 */
function getDeprecationCounter(): DeprecationCounter {
  if (!counter) {
    counter = config.meter.createCounter('tombstones', {
      description: 'Counts the number of tombstones encountered',
    });
  }

  return counter;
}

function initializeCounter(
  counter: DeprecationCounter,
  labels: {
    [K in keyof DeprecationAttributes]: Array<DeprecationAttributes[K]>;
  },
): void {
  const keys = Object.keys(labels) as Array<keyof DeprecationAttributes>;
  const combinations = keys.reduce<Array<Partial<DeprecationAttributes>>>(
    (acc, key) =>
      acc.flatMap((combo) =>
        // @ts-expect-error - TypeScript is confused by the dynamic nature of this combination logic
        labels[key].map((val) => ({ ...combo, [key]: val })),
      ),
    [{}],
  );

  for (const combo of combinations) {
    counter.add(0, combo as DeprecationAttributes);
  }
}

/**
 * Logs a deprecation notice using the configured logger. This function is used internally by the module
 */
function logDeprecationNotice(message: string) {
  getConfig().logger.warn(message);
}

export function constructClassDecorator(
  target: any,
  _context?: ClassDecoratorContext,
) {
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

      initializeCounter(getDeprecationCounter(), {
        type: ['class'],
        member: [subclassName],
        expired: [false, true],
      });

      recordClassInstantiationDeprecationNotice(subclassName, parentClass);
    }
  };
}

export function constructMethodDecorator(
  target: any,
  context: Pick<ClassMethodDecoratorContext, 'name'>,
) {
  const methodName = context.name.toString();
  initializeCounter(getDeprecationCounter(), {
    type: ['method'],
    member: [methodName],
    expired: [false, true],
  });

  return function (this: unknown, ...args: unknown[]) {
    recordMethodInvocationDeprecationNotice(methodName);
    return target.call(this, ...args);
  };
}

export function constructAccessorDecorator(
  target: ClassAccessorDecoratorTarget<unknown, unknown>,
  context: Pick<ClassAccessorDecoratorContext, 'name'>,
) {
  const originalGetter = target.get;
  const originalSetter = target.set;
  const propertyName = context.name.toString();

  initializeCounter(getDeprecationCounter(), {
    type: ['field'],
    member: [propertyName],
    operation: ['read', 'write'],
    expired: [false, true],
  });

  const result: Partial<ClassAccessorDecoratorTarget<unknown, unknown>> = {};
  if (typeof originalGetter === 'function') {
    result.get = function (this: unknown) {
      recordPropertyReadDeprecationNotice(propertyName);
      return originalGetter.call(this);
    };
  }

  if (typeof originalSetter === 'function') {
    result.set = function (this: unknown, val: unknown) {
      recordPropertyWriteDeprecationNotice(propertyName);
      return originalSetter.call(this, val);
    };
  }

  return result;
}

export function constructSetterDecorator(
  target: any,
  context: Pick<ClassSetterDecoratorContext, 'name'>,
) {
  const propertyName = context.name.toString();

  initializeCounter(getDeprecationCounter(), {
    type: ['field'],
    member: [propertyName],
    operation: ['write'],
    expired: [false, true],
  });

  return function (this: unknown, ...args: unknown[]) {
    recordPropertyWriteDeprecationNotice(propertyName);
    return target.call(this, ...args);
  };
}

export function constructGetterDecorator(
  target: any,
  context: Pick<ClassGetterDecoratorContext, 'name'>,
) {
  const propertyName = context.name.toString();

  initializeCounter(getDeprecationCounter(), {
    type: ['field'],
    member: [propertyName],
    operation: ['read'],
    expired: [false, true],
  });

  return function (this: unknown, ...args: unknown[]) {
    recordPropertyReadDeprecationNotice(propertyName);
    return target.call(this, ...args);
  };
}

export function recordPropertyReadDeprecationNotice(
  propertyName: string | symbol,
) {
  logDeprecationNotice(
    `Deprecated property '${propertyName.toString()}' was accessed`,
  );
  getDeprecationCounter().add(1, {
    type: 'field',
    member: propertyName.toString(),
    expired: false,
    operation: 'read',
  });
}

export function recordPropertyWriteDeprecationNotice(
  propertyName: string | symbol,
) {
  logDeprecationNotice(
    `Deprecated property '${propertyName.toString()}' was set`,
  );
  getDeprecationCounter().add(1, {
    type: 'field',
    member: propertyName.toString(),
    expired: false,
    operation: 'write',
  });
}

export function recordMethodInvocationDeprecationNotice(
  methodName: string | symbol,
) {
  logDeprecationNotice(
    `Deprecated method '${methodName.toString()}' was invoked`,
  );
  getDeprecationCounter().add(1, {
    type: 'method',
    member: methodName.toString(),
    expired: false,
  });
}

export function recordClassInstantiationDeprecationNotice(
  className: string,
  parentClassName?: string,
) {
  if (parentClassName) {
    logDeprecationNotice(
      `Subclass (${className}) of deprecated class (${parentClassName}) was instantiated.`,
    );
  } else {
    logDeprecationNotice(
      `Deprecated class of '${className}' was instantiated.`,
    );
  }
  getDeprecationCounter().add(1, {
    type: 'class',
    member: className,
    expired: false,
  });
}
