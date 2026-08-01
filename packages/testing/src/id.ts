export interface IdFactory {
  next(prefix?: string): string;
}

export class SequentialIdFactory implements IdFactory {
  #counter: number;
  readonly #defaultPrefix: string;

  constructor(options: { prefix?: string; start?: number } = {}) {
    const start = options.start ?? 1;
    if (!Number.isSafeInteger(start) || start < 0)
      throw new RangeError("ID start must be a non-negative safe integer");
    this.#counter = start;
    this.#defaultPrefix = options.prefix ?? "test";
  }

  next(prefix = this.#defaultPrefix): string {
    if (!/^[a-z][a-z0-9-]*$/u.test(prefix))
      throw new TypeError("ID prefix must be a lowercase slug");
    const id = `${prefix}_${String(this.#counter).padStart(8, "0")}`;
    this.#counter += 1;
    return id;
  }
}
