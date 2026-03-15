import type { Counter } from '@opentelemetry/api';

export type MemberType = 'class' | 'method' | 'field';
export type OperationType = 'read' | 'write';

export type DeprecationAttributes = {
  type: MemberType;
  member: string;
  expired: boolean;
  operation?: OperationType;
};

export type DeprecationCounter = Counter<DeprecationAttributes>;
