/**
 * Llama esto desde la consola de Expo o como botón temporal
 * para resetear el estado del sueño y volver a ver el onboarding.
 *
 * En la app: se puede activar desde Ajustes o con un botón debug.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function resetSleepStore() {
  await AsyncStorage.removeItem('habits-pioneer-sleep-v1');
  console.log('[Sleep] Store reseteado. Reiniciá la app.');
}
