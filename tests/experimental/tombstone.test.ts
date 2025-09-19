import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import { Tombstone } from '../../src/tombstone.js';

let logMessages: Record<string, unknown>[] = [];
let warnMessages: Record<string, unknown>[] = [];
let errorMessages: Record<string, unknown>[] = [];
const fakeLogger: Partial<Console> = {
  log: (...args: unknown[]) => logMessages.push({ args }),
  debug: (...args: unknown[]) => console.debug(...args),
  warn: (...args: unknown[]) => warnMessages.push({ args }),
  error: (...args: unknown[]) => errorMessages.push({ args }),
};

const tombstone = new Tombstone({
  decoratorVersion: 'experimental',
  logger: fakeLogger as Console,
});

@tombstone.Deprecate()
class DeprecatedTestClass {}

class ExtendedClass extends DeprecatedTestClass {}

class TestClass {
  #internalProperty: string = 'hard private';

  @tombstone.Deprecate()
  testMethod() {}

  @tombstone.Deprecate()
  accessor testProperty = 'original value';

  @tombstone.Deprecate()
  get internalProperty() {
    return this.#internalProperty;
  }

  set internalProperty(val: string) {
    this.#internalProperty = val;
  }

  @tombstone.Deprecate()
  get getterOnly() {
    return this.#internalProperty;
  }

  @tombstone.Deprecate()
  set setterOnly(val: string) {
    this.#internalProperty = val;
  }
}

describe('Tombstone', () => {
  let testClass: TestClass;
  beforeAll(() => {
    testClass = new TestClass();
  });

  beforeEach(() => {
    logMessages = [];
    warnMessages = [];
    errorMessages = [];
  });

  test('Constructing the deprecated class should log a deprecation warning', () => {
    new DeprecatedTestClass();

    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated class of 'DeprecatedTestClass' was instantiated."],
    });
  });

  test('Constructing a class that extends a deprecated class should log a deprecation warning', () => {
    new ExtendedClass();

    expect(warnMessages[0]).toStrictEqual({
      args: [
        'Subclass (ExtendedClass) of deprecated class (DeprecatedTestClass) was instantiated.',
      ],
    });
  });

  test('Invoking the deprecated method should log a deprecation warning', () => {
    testClass.testMethod();

    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated method 'testMethod' was invoked"],
    });
  });

  test('Accessing the deprecated accessor property should log a deprecation warning', () => {
    testClass.testProperty;

    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated property 'testProperty' was accessed"],
    });
  });

  test('Setting the deprecated accessor property should log a deprecation warning', () => {
    testClass.testProperty = 'new value';

    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated property 'testProperty' was set"],
    });
  });

  test('Invoking the deprecated getter method should log a deprecation warning', () => {
    expect(testClass.internalProperty === 'hard private');
    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated property 'internalProperty' was accessed"],
    });
  });

  test('Invoking the deprecated setter method should log a deprecation warning', () => {
    testClass.internalProperty = 'new value';

    expect(warnMessages[0]).toStrictEqual({
      args: ["Deprecated property 'internalProperty' was set"],
    });
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
  });

  test('Decorating a setter-only property should not incur a side-effect of introducing a getter', () => {
    expect(testClass.setterOnly).toBeUndefined();
    expect(warnMessages).toHaveLength(0);
  });
});
