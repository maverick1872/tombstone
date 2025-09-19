import type { Counter, Meter } from '@opentelemetry/api';

export interface FakeMeter extends Partial<Meter> {
  counters: Record<string, number>;
}

export const fakeMeter: FakeMeter = {
  counters: {},
  createCounter(name: string): Counter {
    fakeMeter.counters[name] = 0;
    return {
      add(value: number) {
        fakeMeter.counters[name]! += value;
      },
    } as Counter;
  },
};

export function resetMeterCounters() {
  for (const key in fakeMeter.counters) {
    fakeMeter.counters[key] = 0;
  }
}
