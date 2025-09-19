import type { Counter } from '@opentelemetry/api';

type MemberType = 'class' | 'method' | 'field';
type OperationType = 'read' | 'write';

type DepricationAttributes = {
  type: MemberType;
  member: string;
  expired: boolean;
  operation?: OperationType;
};

export type DeprecationCounter = Counter<DepricationAttributes>;
