import assert from 'node:assert';
import type { Counter, Meter } from '@opentelemetry/api';

interface CounterState {
  total: number;
  operations: CounterOperation[];
}

interface CounterOperation {
  value: number;
  labels: Record<string, unknown>;
}

export interface FakeMeter extends Partial<Meter> {
  counters: Record<string, CounterState>;
}

export const fakeMeter: FakeMeter = {
  counters: {},
  createCounter(name: string): Counter {
    fakeMeter.counters[name] = { total: 0, operations: [] };
    return {
      add(value: number, attributes?: Record<string, unknown>) {
        assert(
          fakeMeter.counters[name],
          `Counter with name ${name} does not exist`,
        );
        const counterState = fakeMeter.counters[name];

        counterState.total = counterState.total
          ? value + counterState.total
          : value;
        counterState.operations.push({
          value,
          labels: attributes || {},
        });
      },
    } as Counter;
  },
};

export function resetMeterCounters() {
  for (const key in fakeMeter.counters) {
    fakeMeter.counters[key] = { total: 0, operations: [] };
  }
}
