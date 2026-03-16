import type { Counter } from '@opentelemetry/api';

type MemberType = 'class' | 'method' | 'field';
type OperationType = 'read' | 'write';

export type DeprecationCounterAttributes = {
  type: MemberType;
  member: string;
  expired: boolean;
  operation?: OperationType;
};

export type DeprecationCounter = Counter<DeprecationCounterAttributes>;
