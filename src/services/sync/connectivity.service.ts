/**
 * connectivity.service.ts
 * Detector de conectividad de red basado en NetInfo.
 * Proporciona estado actual y suscripción a cambios.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/** Verifica si hay conexión disponible ahora mismo */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return !!state.isConnected && !!state.isInternetReachable;
}

/**
 * Suscribe a cambios de conectividad.
 * @returns función de unsubscribe
 */
export function subscribeToConnectivity(
  onChange: (online: boolean) => void,
): () => void {
  return NetInfo.addEventListener((state: NetInfoState) => {
    onChange(!!state.isConnected && !!state.isInternetReachable);
  });
}
