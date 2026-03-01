import { SleepChecklistItem } from '../../types';

export const SLEEP_CHECKLIST: SleepChecklistItem[] = [
  {
    id: 'sc01',
    label: 'Me acosté solo cuando tuve sueño real',
    description: 'No por horario. Esperé el sueño leyendo algo liviano o escuchando música suave.',
    category: 'before',
    isKeyItem: true,
  },
  {
    id: 'sc02',
    label: 'Me levanté a la misma hora con alarma',
    description: 'Misma hora todos los días, sin volver a la cama después.',
    category: 'behavior',
    isKeyItem: true,
  },
  {
    id: 'sc03',
    label: 'Evité café, alcohol y nicotina',
    description: 'Café, energizantes, té, cacao y alcohol alteran el ciclo del sueño.',
    category: 'before',
    isKeyItem: false,
  },
  {
    id: 'sc04',
    label: 'Sin siestas hoy',
    description: 'Las siestas reducen la presión del sueño y dificultan conciliar por la noche.',
    category: 'behavior',
    isKeyItem: false,
  },
  {
    id: 'sc05',
    label: 'Apagué pantallas antes de las 21hs',
    description: 'La luz azul suprime la melatonina. Computadora, celular y TV.',
    category: 'before',
    isKeyItem: false,
  },
  {
    id: 'sc06',
    label: 'No usé pantallas en la cama',
    description: 'Sin TV, celular ni tablet en el dormitorio.',
    category: 'environment',
    isKeyItem: true,
  },
  {
    id: 'sc07',
    label: 'Tuve 15-20 min de transición tranquila',
    description:
      'Bajé la intensidad de la luz, me relajé y realicé rutinas de higiene antes de dormir.',
    category: 'before',
    isKeyItem: false,
  },
  {
    id: 'sc08',
    label: 'El dormitorio fue solo para dormir',
    description: 'No trabajé, comí ni usé el cuarto como sala de estar.',
    category: 'environment',
    isKeyItem: true,
  },
  {
    id: 'sc09',
    label: 'Evité trabajo o ejercicio intenso antes de dormir',
    description: 'Actividades estimulantes en las horas previas dificultan la relajación.',
    category: 'before',
    isKeyItem: false,
  },
  {
    id: 'sc10',
    label: 'Cena liviana y poco condimentada',
    description: 'Las cenas abundantes o condimentadas interrumpen el sueño.',
    category: 'before',
    isKeyItem: false,
  },
  {
    id: 'sc11',
    label: 'Dormitorio oscuro, silencioso y fresco (16-20°C)',
    description: 'Temperatura, ruido y luz son los tres factores ambientales clave.',
    category: 'environment',
    isKeyItem: false,
  },
  {
    id: 'sc12',
    label: 'No miré el reloj si me desperté',
    description: 'Ver la hora de madrugada aumenta la ansiedad y dificulta volver a dormir.',
    category: 'crisis',
    isKeyItem: true,
  },
  {
    id: 'sc13',
    label: 'Si no dormía me levanté de la cama',
    description: 'Me levanté y volví solo cuando tuve sueño real.',
    category: 'crisis',
    isKeyItem: true,
  },
  {
    id: 'sc14',
    label: 'Me levanté ni bien me desperté en la mañana',
    description: 'Sin quedarme leyendo ni desayunando en cama.',
    category: 'behavior',
    isKeyItem: false,
  },
  {
    id: 'sc15',
    label: 'Dejé pendientes anotados antes de dormir',
    description: 'Escribir lo pendiente libera la mente de "recordarlo" durante la noche.',
    category: 'before',
    isKeyItem: false,
  },
  {
    id: 'sc16',
    label: 'Sin automedicación para dormir',
    description: 'Evitar pastillas para dormir sin indicación médica.',
    category: 'behavior',
    isKeyItem: false,
  },
];

export const CATEGORY_META: Record<string, { label: string; icon: string; color: string }> = {
  before: { label: 'Antes de dormir', icon: 'moon', color: '#6366f1' },
  environment: { label: 'Ambiente', icon: 'home-outline', color: '#0ea5e9' },
  behavior: { label: 'Comportamiento', icon: 'repeat-outline', color: '#10b981' },
  crisis: { label: 'Si me despierto', icon: 'alert-circle-outline', color: '#f59e0b' },
};
