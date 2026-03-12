import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import BottomModal from './BottomModal';
import { Spacing, Radius } from '@/theme';

// ── Emoji data ────────────────────────────────────────────────────────────────
// Each entry: emoji character, category, searchable keywords (Spanish)

const EMOJI_DATA: { e: string; cat: string; k: string }[] = [
  // Fitness & Deporte
  { e: '💪', cat: 'Fitness', k: 'fuerza gym brazo ejercicio fitness' },
  { e: '🏋️', cat: 'Fitness', k: 'pesas gym levantamiento fitness' },
  { e: '🏃', cat: 'Fitness', k: 'correr run running trotar ejercicio' },
  { e: '🚴', cat: 'Fitness', k: 'bicicleta ciclismo cycling ejercicio' },
  { e: '🧘', cat: 'Fitness', k: 'yoga meditacion zen relax' },
  { e: '🏊', cat: 'Fitness', k: 'nadar natacion piscina swimming' },
  { e: '🤸', cat: 'Fitness', k: 'gimnasia flexibilidad calistenia' },
  { e: '⚽', cat: 'Fitness', k: 'futbol soccer deporte' },
  { e: '🏀', cat: 'Fitness', k: 'basquet basketball deporte' },
  { e: '🎾', cat: 'Fitness', k: 'tenis tennis deporte raqueta' },
  { e: '🥊', cat: 'Fitness', k: 'boxeo pelea box deporte' },
  { e: '🧗', cat: 'Fitness', k: 'escalar escalada climbing' },
  { e: '🏄', cat: 'Fitness', k: 'surf ola mar deporte' },
  { e: '🚵', cat: 'Fitness', k: 'mountain bike ciclismo montaña' },
  { e: '🏆', cat: 'Fitness', k: 'trofeo campeon ganador premio' },
  { e: '🥋', cat: 'Fitness', k: 'karate artes marciales deporte' },
  { e: '⛹️', cat: 'Fitness', k: 'baloncesto deporte' },
  { e: '🏇', cat: 'Fitness', k: 'equitacion caballo deporte' },

  // Salud & Cuerpo
  { e: '🧠', cat: 'Salud', k: 'cerebro mente salud mental psicologia' },
  { e: '❤️', cat: 'Salud', k: 'corazon amor salud cardiaco' },
  { e: '😴', cat: 'Salud', k: 'dormir descanso sueño sleep' },
  { e: '🛌', cat: 'Salud', k: 'cama dormir descanso sueño' },
  { e: '💊', cat: 'Salud', k: 'pastilla medicamento medicina salud' },
  { e: '🩺', cat: 'Salud', k: 'medico doctor salud consulta' },
  { e: '🦷', cat: 'Salud', k: 'diente muela higiene dental cepillo' },
  { e: '🧴', cat: 'Salud', k: 'crema locion higiene cuidado' },
  { e: '🚿', cat: 'Salud', k: 'ducha baño higiene' },
  { e: '🧘‍♀️', cat: 'Salud', k: 'yoga meditacion relax zen mujer' },
  { e: '🌬️', cat: 'Salud', k: 'respirar respiracion aire meditacion' },
  { e: '💆', cat: 'Salud', k: 'masaje relax relajacion bienestar' },
  { e: '🧪', cat: 'Salud', k: 'laboratorio analisis ciencia' },

  // Comida & Bebida
  { e: '🥗', cat: 'Comida', k: 'ensalada saludable verdura dieta' },
  { e: '🍎', cat: 'Comida', k: 'manzana fruta saludable' },
  { e: '🥦', cat: 'Comida', k: 'brocoli verdura saludable vegetal' },
  { e: '💧', cat: 'Comida', k: 'agua hidratacion liquido beber' },
  { e: '🫖', cat: 'Comida', k: 'te infusion caliente bebida' },
  { e: '☕', cat: 'Comida', k: 'cafe coffee manana rutina bebida' },
  { e: '🥤', cat: 'Comida', k: 'jugo bebida smoothie vaso' },
  { e: '🍳', cat: 'Comida', k: 'cocinar huevo desayuno sarten' },
  { e: '🥘', cat: 'Comida', k: 'cocinar comida guiso preparar' },
  { e: '🍱', cat: 'Comida', k: 'vianda almuerzo comida' },
  { e: '🥩', cat: 'Comida', k: 'carne proteina comida' },
  { e: '🧃', cat: 'Comida', k: 'jugo caja bebida' },
  { e: '🫐', cat: 'Comida', k: 'arandano fruta antioxidante' },
  { e: '🥑', cat: 'Comida', k: 'palta aguacate saludable' },
  { e: '🍇', cat: 'Comida', k: 'uvas fruta comida' },

  // Trabajo & Estudio
  { e: '💻', cat: 'Trabajo', k: 'computadora laptop trabajo programar' },
  { e: '📚', cat: 'Trabajo', k: 'libros leer estudiar aprender' },
  { e: '📖', cat: 'Trabajo', k: 'leer libro lectura aprender' },
  { e: '✏️', cat: 'Trabajo', k: 'lapiz escribir estudiar anotar' },
  { e: '📝', cat: 'Trabajo', k: 'notas escribir apuntes tarea' },
  { e: '💼', cat: 'Trabajo', k: 'maletin trabajo oficina negocio' },
  { e: '📊', cat: 'Trabajo', k: 'grafico estadistica datos trabajo' },
  { e: '📈', cat: 'Trabajo', k: 'crecimiento progreso subida mejorar' },
  { e: '🖥️', cat: 'Trabajo', k: 'monitor computadora escritorio' },
  { e: '📱', cat: 'Trabajo', k: 'celular telefono movil' },
  { e: '🎓', cat: 'Trabajo', k: 'estudiar graduacion universidad titulo' },
  { e: '🔬', cat: 'Trabajo', k: 'microscopio ciencia investigacion' },
  { e: '📐', cat: 'Trabajo', k: 'regla dibujo diseño trabajo' },
  { e: '🗂️', cat: 'Trabajo', k: 'carpeta organizar archivos trabajo' },
  { e: '📅', cat: 'Trabajo', k: 'calendario fecha agenda planificacion' },
  { e: '⏰', cat: 'Trabajo', k: 'alarma despertador tiempo hora' },
  { e: '🖊️', cat: 'Trabajo', k: 'boligrafo escribir firma' },
  { e: '🗒️', cat: 'Trabajo', k: 'libreta notas anotaciones' },

  // Hogar & Vida diaria
  { e: '🏠', cat: 'Hogar', k: 'casa hogar home rutina' },
  { e: '🧹', cat: 'Hogar', k: 'barrer limpiar limpieza hogar' },
  { e: '🧺', cat: 'Hogar', k: 'ropa lavaropa lavar hogar' },
  { e: '🛒', cat: 'Hogar', k: 'supermercado compras lista hogar' },
  { e: '🪴', cat: 'Hogar', k: 'planta regar jardineria hogar' },
  { e: '🐕', cat: 'Hogar', k: 'perro mascota pasear' },
  { e: '🐈', cat: 'Hogar', k: 'gato mascota cuidar' },
  { e: '🧼', cat: 'Hogar', k: 'jabon limpiar higiene lavado' },
  { e: '🪣', cat: 'Hogar', k: 'balde limpieza hogar' },
  { e: '🍽️', cat: 'Hogar', k: 'platos lavar cocina hogar' },
  { e: '🛏️', cat: 'Hogar', k: 'cama hacer tender dormitorio' },
  { e: '🚗', cat: 'Hogar', k: 'auto coche manejo transporte' },

  // Dinero & Finanzas
  { e: '💰', cat: 'Finanzas', k: 'dinero plata ahorrar finanzas' },
  { e: '💳', cat: 'Finanzas', k: 'tarjeta pagar finanzas banco' },
  { e: '🏦', cat: 'Finanzas', k: 'banco finanzas ahorro' },
  { e: '💸', cat: 'Finanzas', k: 'gasto dinero plata finanzas' },
  { e: '📉', cat: 'Finanzas', k: 'baja caida reducir finanzas' },
  { e: '🪙', cat: 'Finanzas', k: 'moneda dinero ahorro finanzas' },
  { e: '💹', cat: 'Finanzas', k: 'inversion bolsa finanzas' },

  // Naturaleza
  { e: '🌿', cat: 'Naturaleza', k: 'planta verde naturaleza' },
  { e: '🌸', cat: 'Naturaleza', k: 'flor primavera naturaleza' },
  { e: '🌞', cat: 'Naturaleza', k: 'sol manana dia energia' },
  { e: '🌙', cat: 'Naturaleza', k: 'luna noche dormir descanso' },
  { e: '⭐', cat: 'Naturaleza', k: 'estrella meta logro especial' },
  { e: '🌈', cat: 'Naturaleza', k: 'arcoiris color diversidad' },
  { e: '🌊', cat: 'Naturaleza', k: 'ola mar agua naturaleza' },
  { e: '🔥', cat: 'Naturaleza', k: 'fuego racha streak motivacion' },
  { e: '⚡', cat: 'Naturaleza', k: 'rayo energia rapido velocidad' },
  { e: '❄️', cat: 'Naturaleza', k: 'frio hielo invierno' },
  { e: '🌻', cat: 'Naturaleza', k: 'girasol flor felicidad alegria' },
  { e: '🍃', cat: 'Naturaleza', k: 'hoja verde naturaleza' },
  { e: '🌺', cat: 'Naturaleza', k: 'hibisco flor tropical naturaleza' },

  // Viaje & Lugares
  { e: '✈️', cat: 'Viaje', k: 'avion viajar viaje volar' },
  { e: '🌍', cat: 'Viaje', k: 'mundo tierra planeta viaje' },
  { e: '🏖️', cat: 'Viaje', k: 'playa verano vacaciones mar' },
  { e: '🏔️', cat: 'Viaje', k: 'montaña naturaleza senderismo' },
  { e: '🗺️', cat: 'Viaje', k: 'mapa viaje explorar' },
  { e: '🚢', cat: 'Viaje', k: 'barco crucero viaje mar' },
  { e: '🚂', cat: 'Viaje', k: 'tren transporte viaje' },
  { e: '🗼', cat: 'Viaje', k: 'paris torre viaje turismo' },

  // Arte & Creatividad
  { e: '🎨', cat: 'Arte', k: 'pintar arte dibujar crear creatividad' },
  { e: '🎵', cat: 'Arte', k: 'musica cantar escuchar nota' },
  { e: '🎸', cat: 'Arte', k: 'guitarra musica instrumento' },
  { e: '🎭', cat: 'Arte', k: 'teatro arte actuacion drama' },
  { e: '📸', cat: 'Arte', k: 'foto fotografia camara capturar' },
  { e: '🖌️', cat: 'Arte', k: 'pincel pintar arte' },
  { e: '✍️', cat: 'Arte', k: 'escribir redactar creatividad' },
  { e: '🎬', cat: 'Arte', k: 'pelicula cine filmar video' },
  { e: '🎮', cat: 'Arte', k: 'videojuego jugar gaming' },
  { e: '🎲', cat: 'Arte', k: 'juego mesa dados entretenimiento' },
  { e: '🎤', cat: 'Arte', k: 'microfono cantar musica' },
  { e: '🎻', cat: 'Arte', k: 'violin musica instrumento' },
  { e: '📻', cat: 'Arte', k: 'radio musica escuchar' },

  // Personas & Social
  { e: '👥', cat: 'Social', k: 'gente personas equipo grupo' },
  { e: '🤝', cat: 'Social', k: 'acuerdo colaborar trabajo equipo' },
  { e: '📞', cat: 'Social', k: 'llamar telefono comunicacion' },
  { e: '💬', cat: 'Social', k: 'chat hablar comunicacion mensaje' },
  { e: '👨‍👩‍👧', cat: 'Social', k: 'familia casa hogar' },
  { e: '🤗', cat: 'Social', k: 'abrazo calidez amor amistad' },
  { e: '🧑‍🤝‍🧑', cat: 'Social', k: 'amigos pareja amistad' },

  // Símbolos & Misc
  { e: '✅', cat: 'Símbolos', k: 'completado listo check tarea' },
  { e: '🎯', cat: 'Símbolos', k: 'objetivo meta diana logro' },
  { e: '✨', cat: 'Símbolos', k: 'brillo especial magia nuevo' },
  { e: '💡', cat: 'Símbolos', k: 'idea luz pensar innovacion' },
  { e: '🔑', cat: 'Símbolos', k: 'llave clave exito importante' },
  { e: '🧩', cat: 'Símbolos', k: 'pieza puzzle estrategia' },
  { e: '⚙️', cat: 'Símbolos', k: 'configurar ajuste proceso sistema' },
  { e: '🚀', cat: 'Símbolos', k: 'cohete lanzar crecer rapido' },
  { e: '📌', cat: 'Símbolos', k: 'pin importante marcar recordar' },
  { e: '🔔', cat: 'Símbolos', k: 'campana notificacion recordar' },
  { e: '🏅', cat: 'Símbolos', k: 'medalla logro premio reconocimiento' },
  { e: '🎖️', cat: 'Símbolos', k: 'medalla honor logro distincion' },
  { e: '🌱', cat: 'Símbolos', k: 'crecer semilla inicio nuevo habito' },
  { e: '♻️', cat: 'Símbolos', k: 'reciclar sostenible repetir rutina' },
  { e: '🔋', cat: 'Símbolos', k: 'energia bateria carga poder' },
  { e: '📡', cat: 'Símbolos', k: 'señal comunicacion tecnologia' },
  { e: '🗝️', cat: 'Símbolos', k: 'clave llave acceso importante' },
  { e: '⚖️', cat: 'Símbolos', k: 'equilibrio balance justicia' },
  { e: '🧲', cat: 'Símbolos', k: 'iman atraer fuerza' },
  { e: '🎁', cat: 'Símbolos', k: 'regalo sorpresa logro celebrar' },
  { e: '🥇', cat: 'Símbolos', k: 'primero ganador exito medalla' },
  { e: '💎', cat: 'Símbolos', k: 'diamante valor precioso' },
  { e: '🔐', cat: 'Símbolos', k: 'candado seguridad privacidad' },
];

// Get unique categories preserving insertion order
const CATEGORIES = Array.from(new Set(EMOJI_DATA.map((e) => e.cat)));

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  value: string;
  onSelect: (emoji: string) => void;
  label?: string;
  containerStyle?: ViewStyle;
}

export default function EmojiPicker({ value, onSelect, label, containerStyle }: Props) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null; // null = show categories
    return EMOJI_DATA.filter((e) => e.k.includes(q) || e.cat.toLowerCase().includes(q));
  }, [query]);

  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    setOpen(false);
    setQuery('');
  };

  const s = styles(theme);

  return (
    <>
      <View style={containerStyle}>
        {label && <Text style={[s.label, { color: theme.textSecondary }]}>{label}</Text>}
        <Pressable
          style={[s.trigger, { backgroundColor: theme.surface2, borderColor: theme.border }]}
          onPress={() => setOpen(true)}
        >
          {value ? (
            <Text style={s.triggerEmoji}>{value}</Text>
          ) : (
            <Text style={[s.triggerPlaceholder, { color: theme.textMuted }]}>＋</Text>
          )}
        </Pressable>
      </View>

      <BottomModal visible={open} onClose={() => { setOpen(false); setQuery(''); }}>
        <Text style={[s.modalTitle, { color: theme.text }]}>
          {label ?? 'Emoji'}
        </Text>

        {/* Search */}
        <TextInput
          style={[s.search, { color: theme.text, backgroundColor: theme.surface2, borderColor: theme.border }]}
          placeholder="Buscar… ej: gym, dormir, dinero"
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCorrect={false}
        />

        {/* Grid */}
        <ScrollView
          style={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filtered ? (
            // Search results — flat grid
            <View style={s.grid}>
              {filtered.length === 0 ? (
                <Text style={[s.empty, { color: theme.textMuted }]}>Sin resultados</Text>
              ) : (
                filtered.map((item) => (
                  <Pressable key={item.e} style={s.emojiBtn} onPress={() => handleSelect(item.e)}>
                    <Text style={s.emoji}>{item.e}</Text>
                  </Pressable>
                ))
              )}
            </View>
          ) : (
            // Category sections
            CATEGORIES.map((cat) => {
              const items = EMOJI_DATA.filter((e) => e.cat === cat);
              return (
                <View key={cat} style={s.section}>
                  <Text style={[s.sectionLabel, { color: theme.textSecondary }]}>{cat}</Text>
                  <View style={s.grid}>
                    {items.map((item) => (
                      <Pressable key={item.e} style={s.emojiBtn} onPress={() => handleSelect(item.e)}>
                        <Text style={s.emoji}>{item.e}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </BottomModal>
    </>
  );
}

const styles = (theme: any) =>
  StyleSheet.create({
    label: { fontSize: 13, marginBottom: Spacing.sm, fontWeight: '500' },
    trigger: {
      paddingVertical: Spacing.md,
      borderRadius: Radius.md,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    triggerEmoji: { fontSize: 24 },
    triggerPlaceholder: { fontSize: 20, fontWeight: '300' },
    modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: Spacing.md },
    search: {
      borderWidth: 1,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      fontSize: 15,
      marginBottom: Spacing.md,
    },
    scroll: { maxHeight: 380 },
    section: { marginBottom: Spacing.md },
    sectionLabel: {
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 6,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    emojiBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: Radius.md,
    },
    emoji: { fontSize: 26 },
    empty: { fontSize: 14, paddingVertical: Spacing.md },
  });
