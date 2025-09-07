// import { type Meter, metrics } from "@opentelemetry/api";
import type {
  Constructable,
  DeprecationConfig,
  Logger,
} from "./tombstone.types.js";

/**
 * A class providing factory methods to create deprecation decorators
 * for classes, methods, and properties.
 */
export class Tombstone {
  // #meter: Meter;
  #logger: Logger;

  /**
   * Creates a new Tombstone instance with optional custom logger and meter
   *
   * @param configuration Configuration options for the Tombstone instance
   */
  constructor(
    configuration: {
      logger?: Logger;
      meter?: import("@opentelemetry/api").Meter;
      config?: Partial<DeprecationConfig>;
    } = {},
  ) {
    this.#logger = configuration.logger ?? console;
    // this.#meter =
    //   configuration.meter || metrics.getMeter("@maverick1872/tombstone");
  }

  public DeprecateClass<T extends Constructable>() {
    return (_constructor: T): T => {
      this.#logger.log("Class created:", _constructor.name);
      return _constructor;
    };
  }

  public DeprecatedMethod() {
    return (_target: unknown, _context: unknown) => {
      this.#logger.log("Method called:", _context);
      return _target;
    };
  }
}
