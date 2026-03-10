/** biome-ignore-all lint/complexity/useLiteralKeys: Can't use literal keys when the key comes from an index signature */
import type { Meter } from '@opentelemetry/api';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';
import {
  configureTombstone,
  Deprecate,
} from '../../src/experimental/tombstone.js';
import { fakeLogger, resetLogger, warnMessages } from '../fakes/logger.js';
import { fakeMeter, resetMeterCounters } from '../fakes/meter.js';

@Deprecate()
class DeprecatedTestClass {}

class ExtendedClass extends DeprecatedTestClass {}

class TestClass {
  #internalProperty: string = 'hard private';

  @Deprecate()
  testMethod() {}

  @Deprecate()
  accessor testProperty = 'original value';

  @Deprecate()
  get internalProperty() {
    return this.#internalProperty;
  }

  set internalProperty(val: string) {
    this.#internalProperty = val;
  }

  @Deprecate()
  get getterOnly() {
    return this.#internalProperty;
  }

  @Deprecate()
  set setterOnly(val: string) {
    this.#internalProperty = val;
  }
}

describe('Tombstone', () => {
  let testClass: TestClass;
  beforeAll(() => {
    configureTombstone({
      logger: fakeLogger as Console,
      meter: fakeMeter as Meter,
    });
    testClass = new TestClass();
  });

  beforeEach(() => {
    resetLogger();
    resetMeterCounters();
  });

  test('Constructing the deprecated class should log a deprecation warning', () => {
    new DeprecatedTestClass();

    expect(warnMessages).toHaveLength(1);
    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated class of 'DeprecatedTestClass' was instantiated."],
    });
    expect(fakeMeter.counters['tombstones']).toBe(1);
  });

  test('Constructing a class that extends a deprecated class should log a deprecation warning', () => {
    new ExtendedClass();

    expect(warnMessages).toHaveLength(1);
    expect(warnMessages[0]).toStrictEqual({
      args: [
        'Subclass (ExtendedClass) of deprecated class (DeprecatedTestClass) was instantiated.',
      ],
    });
    expect(fakeMeter.counters['tombstones']).toBe(1);
  });

  test('Invoking the deprecated method should log a deprecation warning', () => {
    testClass.testMethod();

    expect(warnMessages).toHaveLength(1);
    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated method 'testMethod' was invoked"],
    });
    expect(fakeMeter.counters['tombstones']).toBe(1);
  });

  test('Accessing the deprecated accessor property should log a deprecation warning', () => {
    testClass.testProperty;

    expect(warnMessages).toHaveLength(1);
    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated property 'testProperty' was accessed"],
    });
    expect(fakeMeter.counters['tombstones']).toBe(1);
  });

  test('Setting the deprecated accessor property should log a deprecation warning', () => {
    testClass.testProperty = 'new value';

    expect(warnMessages).toHaveLength(1);
    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated property 'testProperty' was set"],
    });
    expect(fakeMeter.counters['tombstones']).toBe(1);
  });

  test('Invoking the deprecated getter method should log a deprecation warning', () => {
    expect(testClass.internalProperty === 'hard private');
    expect(warnMessages).toHaveLength(1);
    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated property 'internalProperty' was accessed"],
    });
    expect(fakeMeter.counters['tombstones']).toBe(1);
  });

  test('Invoking the deprecated setter method should log a deprecation warning', () => {
    testClass.internalProperty = 'new value';

    expect(warnMessages).toHaveLength(1);
    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated property 'internalProperty' was set"],
    });
    expect(fakeMeter.counters['tombstones']).toBe(1);
  });

  test('Decorating a getter-only property should not incur a side-effect of introducing a setter', () => {
    const updateReadOnlyValue = () => {
      // @ts-expect-error Intentionally trying to set a value on a getter-only property
      testClass.getterOnly = 'new value';
    };

    expect(updateReadOnlyValue).toThrowErrorMatchingInlineSnapshot(
      '[TypeError: Cannot set property getterOnly of #<TestClass> which has only a getter]',
    );
    expect(warnMessages).toHaveLength(0);
    expect(fakeMeter.counters['tombstones']).toBe(0);
  });

  test('Decorating a setter-only property should not incur a side-effect of introducing a getter', () => {
    expect(testClass.setterOnly).toBeUndefined();
    expect(warnMessages).toHaveLength(0);
    expect(fakeMeter.counters['tombstones']).toBe(0);
  });
});
