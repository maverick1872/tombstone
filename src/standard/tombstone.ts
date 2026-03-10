import {
  constructAccessorDecorator,
  constructClassDecorator,
  constructGetterDecorator,
  constructMethodDecorator,
  constructSetterDecorator,
  getConfig,
} from '../core/tombstone.js';

export { configure as configureTombstone } from '../core/tombstone.js';

export function Deprecate(): any {
  return (target: any, context?: DecoratorContext): any => {
    switch (context?.kind) {
      case 'class':
        return constructClassDecorator(target, context);
      case 'method':
        return constructMethodDecorator(target, context);
      case 'field':
        getConfig().logger.error('Field decorators are not yet supported');
        return () => {};
      case 'accessor':
        return constructAccessorDecorator(target, context);
      case 'setter':
        return constructSetterDecorator(target, context);
      case 'getter':
        return constructGetterDecorator(target, context);
      default: {
        // Exhaustiveness guard for future context kinds
        const _never: never = context as never;
        getConfig().logger.error(
          'Deprecated decorator encountered an unknown context kind',
          _never,
        );
        return () => {};
      }
    }
  };
}
