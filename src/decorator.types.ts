export type MethodDecorator<T> = (originalMethod: T, context: unknown) => void;
