import {
  constructAccessorDecorator,
  constructClassDecorator,
  constructMethodDecorator,
  getConfig,
} from '../core/tombstone.js';
import type { DeprecationOptions } from '../core/tombstone.types.js';

export {
  configure as configureTombstone,
  withDeprecation,
} from '../core/tombstone.js';

export function Deprecate(_?: DeprecationOptions): any {
  return (
    target: any,
    propertyKey?: string | symbol,
    descriptor?: TypedPropertyDescriptor<unknown>,
  ) => {
    if (propertyKey === undefined && descriptor === undefined) {
      return constructClassDecorator(target, undefined);
    }

    if (propertyKey && descriptor === undefined) {
      getConfig().logger.error('Field decorators are not yet supported');
      return;
    }

    if (propertyKey && descriptor) {
      if (descriptor.value) {
        const methodName = propertyKey;
        const method: any = descriptor.value;

        descriptor.value = constructMethodDecorator(method, {
          name: methodName,
        } as ClassMethodDecoratorContext);
        return descriptor;
      }

      if (descriptor.get || descriptor.set) {
        return constructAccessorDecorator(
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
