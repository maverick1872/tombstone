export type ExpirmentalDecorators =
  | ExperimentalClassDecorator
  | ExperimentalMethodDecorator
  | ExperimentalPropertyDecorator;

export type ExperimentalClassDecorator = <TFunction extends NewableFunction>(
  target: TFunction,
) => TFunction | undefined;

export type ExperimentalMethodDecorator = <T>(
  target: Record<string, unknown>,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | undefined;

export type ExperimentalPropertyDecorator = (
  target: Record<string, unknown>,
  propertyKey: string | symbol,
) => void;
