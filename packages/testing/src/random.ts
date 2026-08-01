export interface RandomSource {
  next(): number;
  integer(minimum: number, maximum: number): number;
  pick<T>(values: readonly T[]): T;
  shuffle<T>(values: readonly T[]): T[];
}

function assertIntegerRange(minimum: number, maximum: number): void {
  if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || maximum < minimum) {
    throw new RangeError("Random integer range must contain safe integers with maximum >= minimum");
  }
}

export class SeededRandom implements RandomSource {
  #state: number;

  constructor(seed: number) {
    if (!Number.isSafeInteger(seed)) throw new TypeError("Random seed must be a safe integer");
    this.#state = seed >>> 0 || 0x6d2b79f5;
  }

  next(): number {
    let value = (this.#state += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    this.#state = value >>> 0;
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }

  integer(minimum: number, maximum: number): number {
    assertIntegerRange(minimum, maximum);
    return Math.floor(this.next() * (maximum - minimum + 1)) + minimum;
  }

  pick<T>(values: readonly T[]): T {
    if (values.length === 0) throw new RangeError("Cannot pick from an empty collection");
    return values[this.integer(0, values.length - 1)] as T;
  }

  shuffle<T>(values: readonly T[]): T[] {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = this.integer(0, index);
      [result[index], result[target]] = [result[target] as T, result[index] as T];
    }
    return result;
  }
}
