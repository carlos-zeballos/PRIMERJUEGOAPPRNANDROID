/**
 * match-clock.ts
 * Reloj de partida con soporte de pausas.
 * Usa Date.now() para los timestamps absolutos y acumula
 * la duración activa manualmente para evitar contar el tiempo en pausa.
 *
 * Diseño:
 *   - activeDurationMs: tiempo real jugando (sin pausas)
 *   - pausedDurationMs: tiempo acumulado en pausa
 *   - _segmentStart: momento en que empezó el segmento activo actual
 */

export interface ClockSnapshot {
  startedAt: number;
  activeDurationMs: number;
  pausedDurationMs: number;
  isPaused: boolean;
  lastCheckpointAt: number;
}

export class MatchClock {
  private readonly startedAt: number;
  private activeDurationMs: number;
  private pausedDurationMs: number;
  private isPaused: boolean;
  private segmentStartMs: number;   // cuándo empezó el segmento activo actual
  private lastCheckpointAt: number;

  constructor(snapshot?: ClockSnapshot) {
    if (snapshot) {
      this.startedAt       = snapshot.startedAt;
      this.activeDurationMs = snapshot.activeDurationMs;
      this.pausedDurationMs = snapshot.pausedDurationMs;
      this.isPaused        = snapshot.isPaused;
      this.segmentStartMs  = snapshot.isPaused ? 0 : Date.now();
      this.lastCheckpointAt = snapshot.lastCheckpointAt;
    } else {
      const now = Date.now();
      this.startedAt       = now;
      this.activeDurationMs = 0;
      this.pausedDurationMs = 0;
      this.isPaused        = false;
      this.segmentStartMs  = now;
      this.lastCheckpointAt = now;
    }
  }

  /** Pausa el reloj. No tiene efecto si ya está pausado. */
  pause(): void {
    if (this.isPaused) return;
    const now = Date.now();
    this.activeDurationMs += now - this.segmentStartMs;
    this.isPaused = true;
    this.segmentStartMs = 0;
  }

  /** Reanuda el reloj. No tiene efecto si ya está activo. */
  resume(): void {
    if (!this.isPaused) return;
    this.segmentStartMs = Date.now();
    this.isPaused = false;
  }

  /** Tiempo activo acumulado hasta ahora (incluyendo segmento en curso). */
  getActiveDurationMs(): number {
    if (this.isPaused) return this.activeDurationMs;
    return this.activeDurationMs + (Date.now() - this.segmentStartMs);
  }

  /** Guarda un checkpoint y retorna el snapshot. */
  checkpoint(): ClockSnapshot {
    this.lastCheckpointAt = Date.now();
    return this.snapshot();
  }

  /** Snapshot del estado actual (para persistencia). */
  snapshot(): ClockSnapshot {
    return {
      startedAt:       this.startedAt,
      activeDurationMs: this.getActiveDurationMs(),
      pausedDurationMs: this.pausedDurationMs,
      isPaused:        this.isPaused,
      lastCheckpointAt: this.lastCheckpointAt,
    };
  }

  /** Tiempo total transcurrido desde el inicio (activo + pausa). */
  getTotalDurationMs(): number {
    return Date.now() - this.startedAt;
  }

  get isRunning(): boolean {
    return !this.isPaused;
  }
}
