import { useEffect, useRef, useState } from 'react';

/**
 * Cuenta regresiva para límites de turno (Modo Local).
 * Se reinicia cada vez que cambia `resetKey` (ej. equipo activo o id de
 * turno). Si `seconds` es null, no hay límite y no corre ningún timer.
 */
export function useTurnCountdown(
  seconds: number | null,
  resetKey: string | number,
  onExpire: () => void,
): number | null {
  const [remaining, setRemaining] = useState<number | null>(seconds);

  // Ref para que el intervalo siempre llame a la versión más reciente de
  // onExpire sin tener que reiniciar el countdown cuando ese callback cambia
  // de identidad entre renders.
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (seconds === null) {
      setRemaining(null);
      return;
    }
    setRemaining(seconds);

    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onExpireRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seconds, resetKey]);

  return remaining;
}
