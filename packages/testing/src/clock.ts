export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export class FakeClock implements Clock {
  #instant: number;

  constructor(initialInstant: Date | string | number) {
    const timestamp = new Date(initialInstant).getTime();
    if (!Number.isFinite(timestamp)) throw new TypeError("FakeClock requires a valid instant");
    this.#instant = timestamp;
  }

  now(): Date {
    return new Date(this.#instant);
  }

  set(instant: Date | string | number): void {
    const timestamp = new Date(instant).getTime();
    if (!Number.isFinite(timestamp)) throw new TypeError("FakeClock requires a valid instant");
    this.#instant = timestamp;
  }

  advance(milliseconds: number): void {
    if (!Number.isFinite(milliseconds)) throw new TypeError("Advance duration must be finite");
    this.#instant += milliseconds;
  }
}
