/** Tracks frame delta and total elapsed time, both in seconds. */
export class Clock {
  elapsed = 0;
  private last = 0;
  private started = false;

  /** Advance using the rAF timestamp (ms). Returns clamped delta in seconds. */
  tick(nowMs: number): number {
    if (!this.started) {
      this.last = nowMs;
      this.started = true;
      return 0;
    }
    let dt = (nowMs - this.last) / 1000;
    this.last = nowMs;
    // Clamp to avoid a huge time-step after the tab was backgrounded.
    if (dt > 0.1) dt = 0.1;
    this.elapsed += dt;
    return dt;
  }
}
