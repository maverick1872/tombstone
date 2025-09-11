export type LegacyClassDecorator = <TFunction extends NewableFunction>(
  target: TFunction,
) => TFunction | undefined;

export type LegacyMethodDecorator = <T>(
  target: Record<string, unknown>,
  propertyKey: string | symbol,
  descriptor: TypedPropertyDescriptor<T>,
) => TypedPropertyDescriptor<T> | undefined;

export type LegacyPropertyDecorator = (
  target: Record<string, unknown>,
  propertyKey: string | symbol,
) => void;
