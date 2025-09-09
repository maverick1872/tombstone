import { Tombstone } from "../src/index.ts";
const { DeprecateMethod, DeprecateClass, DeprecateProperty } = new Tombstone();

@DeprecateClass()
class TestClass {
  constructor(public x: number) {}

  @DeprecateProperty()
  bar: string = "hello";

  @DeprecateMethod()
  public fooked() {
    console.log("yous a fookin legend");
  }
}

new TestClass(42);
