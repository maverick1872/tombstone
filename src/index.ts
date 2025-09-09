// import { type Meter, metrics } from "@opentelemetry/api";
import type { DeprecationConfig, Logger } from "./tombstone.types.js";

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
    this.#logger.log("Tombstone initialized");
    // this.#meter =
    //   configuration.meter || metrics.getMeter("@maverick1872/tombstone");
  }

  public DeprecateClass(): ClassDecorator {
    const decorator: ClassDecorator = (target) => {
      this.#logger.log("Class created:", target.name);
      return target;
    };

    return decorator.bind(this);
  }

  public DeprecateMethod(): MethodDecorator {
    const decorator: MethodDecorator = (_target, propertyKey, descriptor) => {
      this.#logger.log("Method called:", propertyKey);
      return descriptor;
    };

    return decorator.bind(this);
  }

  public DeprecateProperty(): PropertyDecorator {
    const decorator: PropertyDecorator = (target, propertyKey) => {
      this.#logger.log("Method called:", propertyKey);
      return target;
    };
    return decorator.bind(this);
  }
}
