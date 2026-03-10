## @maverick18722/tombstone

> ⚠️ **PROOF OF CONCEPT** — This library is in early, experimental development. APIs are unstable, behavior may change without notice, and it is **not recommended for production use**. Feedback and contributions are welcome.

You said you'd delete that old code. You didn't. It's still there. People are still calling it. You don't even know how many.

Tombstone is here for your "I'll remove it in the next sprint" code that has survived three team leads, two rewrites, and a company rebrand. Slap a decorator on your deprecated classes, methods, and accessors and let Tombstone do the rest — automatically emitting warnings and [OpenTelemetry](https://opentelemetry.io/) metrics so you can finally, *definitively* prove that yes, someone is still using `OldPaymentService`, and no, you cannot delete it yet.

### Known Limitations

- Field decorators (non-accessor class properties) are not yet supported.
- The experimental decorator path does not support standalone property decorators (only methods, getters, setters, and classes).

### Planned Features

- **Deprecation expiry (`expiresOn`)** — decorators will accept an `expiresOn: Date` option. Once that date passes, and `enableDeprecationExpiries` is enabled via configuration, the deprecation notice will be elevated from a warning to a thrown error. This is intended to give consumers a hard deadline to migrate off deprecated code.

---

## What Happens When a Decorated Member Is Used

Every time a decorated class, method, or accessor is accessed, Tombstone will:

1. **Log a warning** via the configured logger, e.g.:
   - `Deprecated method 'oldMethod' was invoked`
   - `Deprecated class of 'OldService' was instantiated.`
   - `Deprecated property 'legacyValue' was accessed`

2. **Emit an OTEL counter metric (if enabled)** — `tombstones` — with the following attributes:

   | Attribute | Values | Description |
   |---|---|---|
   | `type` | `class`, `method`, `field` | The kind of deprecated member |
   | `member` | string | The name of the class, method, or property |
   | `expired` | boolean | Whether the deprecation expiry has passed |
   | `operation` | `read`, `write` | For fields/accessors only |

   Counters are pre-initialized to `0` for all label combinations at decoration time, making it easy to set up alerts for any usage greater than zero.

---

## Installation

```bash
npm install @maverick18722/tombstone
```

### Requirements

- `@opentelemetry/api` ^1.4.0 — only required if you enable metrics (see [Configuration](#configuration))

If you intend to use the built-in OpenTelemetry metrics, also install the peer dependency:

```bash
npm install @opentelemetry/api
```

If you disable metrics via `configureTombstone({ enableMetrics: false })`, `@opentelemetry/api` is not required.

---

## Usage

Tombstone ships two decorator implementations to accommodate different environments:

| Import path | Decorator standard |
|---|---|
| `@maverick18722/tombstone` | TC39 (standard) |
| `@maverick18722/tombstone/standard` | TC39 (standard) |
| `@maverick18722/tombstone/experimental` | TypeScript experimental |

### Which should I use?

- **Plain JavaScript** or **TypeScript 5.0+ without `experimentalDecorators`**: use the default or `/standard` export.
- **TypeScript with `"experimentalDecorators": true`** (common in Angular, NestJS, or older TypeScript setups): use the `/experimental` export.

If you're unsure, try the default export first.


### Configuration

Before using any decorators, you can optionally configure the module globally. If you skip this step, sensible defaults are used.

```ts
import { configureTombstone } from '@maverick18722/tombstone';

configureTombstone({
  // Custom logger — must implement { warn, error }. Defaults to console.
  logger: myLogger,

  // Provide your own OpenTelemetry Meter instance
  meter: myMeter,

  // Enable/disable OTEL metrics emission. Defaults to true.
  // Set to false if you don't have @opentelemetry/api installed.
  enableMetrics: true,

  // If true, deprecations with an `expiresOn` date in the past will throw
  // an error instead of logging a warning. Defaults to false.
  enableDeprecationExpiries: false,

  // Configures library to begin mining bitcoin when deprecated members that have
  // expireed, are accessed.
  // NOTE: This is a joke option and has no effect on the behavior of the library.
  sponsorAuthorViaExpiredDeprecations?: boolean;
});
```

`configureTombstone` should be called once at application startup, before any decorated classes are instantiated or methods are invoked.

---

## Standard (TC39) Decorators

```ts
import { Deprecate } from '@maverick18722/tombstone';
// or explicitly:
import { Deprecate } from '@maverick18722/tombstone/standard';

// Deprecated class
@Deprecate()
class OldService {
  doThing() { /* ... */ }
}

// Deprecated method
class MyService {
  @Deprecate()
  oldMethod() {
    return 'legacy result';
  }
}

// Deprecated getter/setter
class MyConfig {
  @Deprecate()
  get legacyValue() {
    return this._val;
  }

  @Deprecate()
  set legacyValue(v: string) {
    this._val = v;
  }
}

// Deprecated auto-accessor
class MyModel {
  @Deprecate()
  accessor legacyField = 'default';
}
```

## Experimental (TypeScript) Decorators

```ts
import { Deprecate } from '@maverick18722/tombstone/experimental';

// Deprecated class
@Deprecate()
class OldService { /* ... */ }

// Deprecated method
class MyService {
  @Deprecate()
  oldMethod() {
    return 'legacy result';
  }
}

// Deprecated getter/setter
class MyConfig {
  @Deprecate()
  get legacyValue() {
    return this._val;
  }
}
```

