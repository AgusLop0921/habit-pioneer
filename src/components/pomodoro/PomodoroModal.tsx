/**
 * PomodoroModal.tsx
 * Multi-view fullscreen modal for the Pomodoro Timer.
 * Views: setup → active → completed → (back to setup)
 * Settings tab accessible from setup and active views.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
    Modal,
    View,
    Text,
    Pressable,
    StyleSheet,
    ScrollView,
    Animated,
    TextInput,
    Switch,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { usePomodoroStore, POMODORO_COLORS, MOTIVATIONAL_MESSAGES } from '@/store/pomodoroStore';
import { useStore } from '@/store';
import { Radius, Spacing } from '@/theme';
import type { PomodoroMode } from '@/types';
import { format } from 'date-fns';

// ── Progress ring constants ───────────────────────────────────────────────────
const RING_SIZE = 260;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const MODE_LABELS: Record<PomodoroMode, string> = {
    work: 'Trabajo',
    shortBreak: 'Descanso',
    longBreak: 'Descanso largo',
};

// ── Sub-views ─────────────────────────────────────────────────────────────────

function ModeSelector({ value, onChange, accentColor }: {
    value: PomodoroMode;
    onChange: (m: PomodoroMode) => void;
    accentColor: string;
}) {
    const { theme } = useTheme();
    const modes: PomodoroMode[] = ['work', 'shortBreak', 'longBreak'];
    return (
        <View style={sv.modeRow}>
            {modes.map((m) => {
                const color = POMODORO_COLORS[m];
                const active = value === m;
                return (
                    <Pressable
                        key={m}
                        onPress={() => onChange(m)}
                        style={[
                            sv.modeChip,
                            { borderColor: active ? color : theme.border, backgroundColor: theme.surface2 },
                            active && { backgroundColor: `${color}18` },
                        ]}
                    >
                        <Text style={[sv.modeChipText, { color: active ? color : theme.textSecondary }]}>
                            {MODE_LABELS[m]}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

// ── Setup view ────────────────────────────────────────────────────────────────

function SetupView({ onStart, onOpenSettings }: { onStart: () => void; onOpenSettings: () => void }) {
    const { theme } = useTheme();
    const {
        currentMode,
        settings,
        linkedTaskId,
        startTimer,
        linkTask,
    } = usePomodoroStore();

    const tasks = useStore((s) => s.tasks).filter((t) => !t.completed);
    const addTask = useStore((s) => s.addTask);
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayTasks = tasks.filter((t) => t.date === today);

    const [localMode, setLocalMode] = useState<PomodoroMode>(currentMode);
    const [showTaskPicker, setShowTaskPicker] = useState(false);
    const [showNewTask, setShowNewTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskCategory, setNewTaskCategory] = useState('personal');
    const [searchQuery, setSearchQuery] = useState('');

    const allCategories = useStore((s) => s.getAllCategories)();

    const accentColor = POMODORO_COLORS[localMode];
    const duration = localMode === 'work'
        ? settings.workDuration
        : localMode === 'shortBreak'
            ? settings.shortBreakDuration
            : settings.longBreakDuration;

    const linkedTask = todayTasks.find((t) => t.id === linkedTaskId);

    const filteredTasks = searchQuery.trim()
        ? todayTasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
        : todayTasks;

    const handleStart = () => {
        startTimer(localMode);
        onStart();
    };

    const handleCreateAndLink = async () => {
        if (!newTaskTitle.trim()) return;
        const tempId = `pomodoro-${Date.now()}`;
        await addTask({
            title: newTaskTitle.trim(),
            priority: 'medium',
            date: today,
            category: newTaskCategory,
        });
        // Find the freshly added task by title
        const fresh = useStore.getState().tasks.find(
            (t) => t.title === newTaskTitle.trim() && t.date === today && !t.completed
        );
        if (fresh) linkTask(fresh.id);
        setNewTaskTitle('');
        setShowNewTask(false);
        setShowTaskPicker(false);
    };

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={sv.setupContent}>
            {/* Header */}
            <View style={sv.setupHeader}>
                <Text style={[sv.setupTitle, { color: theme.text }]}>Nuevo Pomodoro</Text>
                <Pressable onPress={onOpenSettings} style={sv.settingsBtn}>
                    <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
                </Pressable>
            </View>

            {/* Mode selector */}
            <Text style={[sv.label, { color: theme.textSecondary }]}>Modo</Text>
            <ModeSelector value={localMode} onChange={setLocalMode} accentColor={accentColor} />

            {/* Duration display */}
            <View style={[sv.durationCard, { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}40` }]}>
                <Text style={[sv.durationTime, { color: accentColor }]}>{duration}:00</Text>
                <Text style={[sv.durationLabel, { color: accentColor }]}>minutos</Text>
            </View>

            {/* Link a task */}
            {localMode === 'work' && (
                <>
                    <Text style={[sv.label, { color: theme.textSecondary }]}>Vincular tarea (opcional)</Text>

                    {/* Linked task pill */}
                    {linkedTask ? (
                        <Pressable
                            style={[sv.linkedTask, { backgroundColor: theme.surface2, borderColor: accentColor }]}
                            onPress={() => { setShowTaskPicker(true); setShowNewTask(false); }}
                        >
                            <Text style={[sv.linkedTaskText, { color: theme.text }]} numberOfLines={1}>
                                📌 {linkedTask.title}
                            </Text>
                            <Pressable onPress={() => linkTask(null)}>
                                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                            </Pressable>
                        </Pressable>
                    ) : (
                        /* Action row: search + new */
                        <View style={sv.taskActionRow}>
                            <Pressable
                                style={[sv.taskActionBtn, { backgroundColor: theme.surface2, borderColor: theme.border, flex: 1 }]}
                                onPress={() => { setShowTaskPicker((v) => !v); setShowNewTask(false); setSearchQuery(''); }}
                            >
                                <Ionicons name="search-outline" size={15} color={theme.textSecondary} />
                                <Text style={[sv.taskActionBtnText, { color: theme.textSecondary }]}>Buscar</Text>
                            </Pressable>
                            <Pressable
                                style={[sv.taskActionBtn, { backgroundColor: `${accentColor}18`, borderColor: accentColor, flex: 1 }]}
                                onPress={() => { setShowNewTask((v) => !v); setShowTaskPicker(false); }}
                            >
                                <Ionicons name="add" size={15} color={accentColor} />
                                <Text style={[sv.taskActionBtnText, { color: accentColor }]}>Nueva tarea</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Inline new task creator */}
                    {showNewTask && (
                        <View style={[sv.newTaskBox, { backgroundColor: theme.surface2, borderColor: `${accentColor}50` }]}>
                            <TextInput
                                style={[sv.newTaskInput, { color: theme.text, borderColor: theme.border }]}
                                placeholder="¿Qué vas a trabajar?"
                                placeholderTextColor={theme.textMuted}
                                value={newTaskTitle}
                                onChangeText={setNewTaskTitle}
                                autoFocus
                                returnKeyType="done"
                                onSubmitEditing={handleCreateAndLink}
                            />
                            {/* Category chips */}
                            <View style={sv.catChipRow}>
                                {allCategories.map((cat) => (
                                    <Pressable
                                        key={cat.id}
                                        style={[
                                            sv.catChip,
                                            { backgroundColor: theme.surface, borderColor: theme.border },
                                            newTaskCategory === cat.id && { backgroundColor: `${accentColor}20`, borderColor: accentColor },
                                        ]}
                                        onPress={() => setNewTaskCategory(cat.id)}
                                    >
                                        <Text style={[sv.catChipText, { color: newTaskCategory === cat.id ? accentColor : theme.textSecondary }]}>
                                            {cat.emoji} {cat.label}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                            <View style={sv.newTaskActions}>
                                <Pressable
                                    style={[sv.newTaskCancel, { borderColor: theme.border }]}
                                    onPress={() => { setShowNewTask(false); setNewTaskTitle(''); }}
                                >
                                    <Text style={[sv.newTaskCancelText, { color: theme.textSecondary }]}>Cancelar</Text>
                                </Pressable>
                                <Pressable
                                    style={[sv.newTaskCreate, { backgroundColor: accentColor, opacity: newTaskTitle.trim() ? 1 : 0.5 }]}
                                    onPress={handleCreateAndLink}
                                    disabled={!newTaskTitle.trim()}
                                >
                                    <Ionicons name="checkmark" size={15} color="#fff" />
                                    <Text style={sv.newTaskCreateText}>Crear y vincular</Text>
                                </Pressable>
                            </View>
                        </View>
                    )}

                    {/* Task search picker */}
                    {showTaskPicker && (
                        <>
                            <TextInput
                                style={[sv.searchInput, { color: theme.text, backgroundColor: theme.surface2, borderColor: theme.border }]}
                                placeholder="Buscar tarea del día..."
                                placeholderTextColor={theme.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                autoFocus
                            />
                            {filteredTasks.length > 0 ? (
                                <View style={[sv.taskList, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                    {filteredTasks.map((task) => (
                                        <Pressable
                                            key={task.id}
                                            style={[sv.taskOption, { borderBottomColor: theme.borderDim }]}
                                            onPress={() => {
                                                linkTask(task.id);
                                                setShowTaskPicker(false);
                                            }}
                                        >
                                            <Text style={[sv.taskOptionText, { color: theme.text }]} numberOfLines={1}>
                                                {task.title}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            ) : (
                                <Text style={[sv.emptyTasks, { color: theme.textMuted }]}>
                                    {searchQuery ? 'Sin resultados' : 'No hay tareas pendientes hoy'}
                                </Text>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Start button */}
            <Pressable
                style={[sv.startBtn, { backgroundColor: accentColor }]}
                onPress={handleStart}
            >
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={sv.startBtnText}>Iniciar sesión</Text>
            </Pressable>
        </ScrollView>
    );
}


// ── Active view ───────────────────────────────────────────────────────────────

function ActiveView({ onCancel }: { onCancel: () => void }) {
    const { theme } = useTheme();
    const {
        status,
        currentMode,
        secondsRemaining,
        sessionCount,
        linkedTaskId,
        settings,
        pauseTimer,
        resumeTimer,
        cancelTimer,
        completeSession,
        getModeDurationSeconds,
    } = usePomodoroStore();

    const tasks = useStore((s) => s.tasks);
    const linkedTask = tasks.find((t) => t.id === linkedTaskId);
    const accentColor = POMODORO_COLORS[currentMode];
    const isRunning = status === 'running';

    const totalSeconds = getModeDurationSeconds(currentMode);
    const progressRatio = 1 - secondsRemaining / totalSeconds;

    // Animated ring
    const animatedProgress = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(animatedProgress, {
            toValue: progressRatio,
            duration: 800,
            useNativeDriver: false,
        }).start();
    }, [progressRatio]);

    const strokeDashoffset = animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: [RING_CIRCUMFERENCE, 0],
    });

    // Color animated value for track color
    const sessionLabel = currentMode === 'work'
        ? `Sesión ${sessionCount + 1} de ${settings.sessionsUntilLongBreak}`
        : MODE_LABELS[currentMode];

    const handleCancel = () => {
        cancelTimer();
        onCancel();
    };

    return (
        <View style={av.container}>
            {/* Mode label */}
            <View style={[av.modeBadge, { backgroundColor: `${accentColor}18` }]}>
                <Text style={[av.modeBadgeText, { color: accentColor }]}>{MODE_LABELS[currentMode]}</Text>
            </View>

            <Text style={[av.sessionLabel, { color: theme.textSecondary }]}>{sessionLabel}</Text>

            {/* Big progress ring */}
            <View style={av.ringWrapper}>
                <Svg width={RING_SIZE} height={RING_SIZE} style={StyleSheet.absoluteFill}>
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        stroke={`${accentColor}25`}
                        strokeWidth={RING_STROKE}
                        fill="none"
                    />
                    <AnimatedCircle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        stroke={accentColor}
                        strokeWidth={RING_STROKE}
                        fill="none"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-90"
                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                    />
                </Svg>

                <View style={{ width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[av.timeDisplay, { color: theme.text }]}>{formatTime(secondsRemaining)}</Text>
                    {linkedTask && (
                        <Text style={[av.linkedTaskText, { color: theme.textSecondary }]} numberOfLines={1}>
                            📌 {linkedTask.title}
                        </Text>
                    )}
                </View>
            </View>

            {/* Controls */}
            <View style={av.controls}>
                <Pressable
                    style={[av.controlBtn, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                    onPress={handleCancel}
                >
                    <Ionicons name="stop" size={20} color={theme.textSecondary} />
                    <Text style={[av.controlBtnText, { color: theme.textSecondary }]}>Cancelar</Text>
                </Pressable>

                <Pressable
                    style={[av.primaryBtn, { backgroundColor: accentColor }]}
                    onPress={isRunning ? pauseTimer : resumeTimer}
                >
                    <Ionicons name={isRunning ? 'pause' : 'play'} size={22} color="#fff" />
                    <Text style={av.primaryBtnText}>{isRunning ? 'Pausar' : 'Reanudar'}</Text>
                </Pressable>

                <Pressable
                    style={[av.controlBtn, { backgroundColor: theme.surface2, borderColor: theme.border }]}
                    onPress={completeSession}
                >
                    <Ionicons name="checkmark" size={20} color={theme.textSecondary} />
                    <Text style={[av.controlBtnText, { color: theme.textSecondary }]}>Completar</Text>
                </Pressable>
            </View>
        </View>
    );
}

// ── Completed view ────────────────────────────────────────────────────────────

function CompletedView({ onContinue, onClose }: { onContinue: () => void; onClose: () => void }) {
    const { theme } = useTheme();
    const { currentMode, startTimer, cancelTimer, settings, sessionCount } = usePomodoroStore();

    const accentColor = POMODORO_COLORS[currentMode];
    const message = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

    // Pop-in animation
    const popAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.spring(popAnim, {
            toValue: 1,
            useNativeDriver: true,
            damping: 14,
            stiffness: 180,
        }).start();
    }, []);

    const nextLabel = currentMode === 'work' ? '¡Tomar descanso!' : '¡A trabajar!';
    const nextMode: PomodoroMode = currentMode === 'work'
        ? sessionCount % settings.sessionsUntilLongBreak === 0 ? 'longBreak' : 'shortBreak'
        : 'work';

    const handleContinue = () => {
        startTimer(nextMode);
        onContinue();
    };

    const handleSkip = () => {
        cancelTimer();
        onClose();
    };

    return (
        <View style={cv.container}>
            <Animated.View style={[cv.emoji, { transform: [{ scale: popAnim }] }]}>
                <Text style={cv.emojiText}>🎉</Text>
            </Animated.View>

            <Text style={[cv.title, { color: theme.text }]}>¡Sesión completada!</Text>
            <Text style={[cv.message, { color: theme.textSecondary }]}>{message}</Text>

            <Pressable
                style={[cv.mainBtn, { backgroundColor: POMODORO_COLORS[nextMode] }]}
                onPress={handleContinue}
            >
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={cv.mainBtnText}>{nextLabel}</Text>
            </Pressable>

            <Pressable style={cv.skipBtn} onPress={handleSkip}>
                <Text style={[cv.skipText, { color: theme.textSecondary }]}>Terminar por ahora</Text>
            </Pressable>
        </View>
    );
}

// ── Settings view ─────────────────────────────────────────────────────────────

function SettingsView({ onBack }: { onBack: () => void }) {
    const { theme } = useTheme();
    const { settings, updateSettings } = usePomodoroStore();

    const [work, setWork] = useState(String(settings.workDuration));
    const [shortB, setShortB] = useState(String(settings.shortBreakDuration));
    const [longB, setLongB] = useState(String(settings.longBreakDuration));
    const [sessions, setSessions] = useState(String(settings.sessionsUntilLongBreak));

    const handleSave = () => {
        updateSettings({
            workDuration: Math.max(1, Math.min(90, Number(work) || 25)),
            shortBreakDuration: Math.max(1, Math.min(30, Number(shortB) || 5)),
            longBreakDuration: Math.max(5, Math.min(60, Number(longB) || 15)),
            sessionsUntilLongBreak: Math.max(1, Math.min(8, Number(sessions) || 4)),
        });
        onBack();
    };

    const Field = ({ label, value, onChange, color }: {
        label: string; value: string;
        onChange: (v: string) => void; color: string;
    }) => (
        <View style={[sfv.field, { borderColor: theme.border }]}>
            <Text style={[sfv.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
            <View style={sfv.fieldRight}>
                <TextInput
                    style={[sfv.input, { color, borderColor: color, backgroundColor: `${color}12` }]}
                    value={value}
                    onChangeText={onChange}
                    keyboardType="numeric"
                    maxLength={2}
                    selectTextOnFocus
                />
                <Text style={[sfv.unit, { color: theme.textMuted }]}>min</Text>
            </View>
        </View>
    );

    return (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={sfv.container}>
            <View style={sfv.header}>
                <Pressable onPress={onBack} style={sfv.backBtn} hitSlop={8}>
                    <Ionicons name="arrow-back" size={20} color={theme.textSecondary} />
                </Pressable>
                <Text style={[sfv.title, { color: theme.text }]}>Configuración</Text>
                <View style={{ width: 28 }} />
            </View>

            <Text style={[sfv.section, { color: theme.textSecondary }]}>DURACIONES</Text>

            <Field label="Trabajo" value={work} onChange={setWork} color={POMODORO_COLORS.work} />
            <Field label="Descanso corto" value={shortB} onChange={setShortB} color={POMODORO_COLORS.shortBreak} />
            <Field label="Descanso largo" value={longB} onChange={setLongB} color={POMODORO_COLORS.longBreak} />

            <Text style={[sfv.section, { color: theme.textSecondary, marginTop: Spacing.lg }]}>CICLO</Text>
            <Field label="Sesiones hasta descanso largo" value={sessions} onChange={setSessions} color={POMODORO_COLORS.work} />

            <Text style={[sfv.section, { color: theme.textSecondary, marginTop: Spacing.lg }]}>OPCIONES</Text>
            <View style={[sfv.toggle, { borderColor: theme.border }]}>
                <Text style={[sfv.toggleLabel, { color: theme.text }]}>Auto-iniciar descanso</Text>
                <Switch
                    value={settings.autoStartBreak}
                    onValueChange={(v) => updateSettings({ autoStartBreak: v })}
                    thumbColor="#fff"
                    trackColor={{ false: theme.border, true: POMODORO_COLORS.work }}
                />
            </View>

            <Pressable style={[sfv.saveBtn, { backgroundColor: POMODORO_COLORS.work }]} onPress={handleSave}>
                <Text style={sfv.saveBtnText}>Guardar cambios</Text>
            </Pressable>
        </ScrollView>
    );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

type ModalView = 'setup' | 'active' | 'completed' | 'settings';

export default function PomodoroModal() {
    const { theme } = useTheme();
    const { isModalOpen, status, closeModal, cancelTimer } = usePomodoroStore();

    // Determine which view to show based on timer status
    const [view, setView] = useState<ModalView>('setup');

    useEffect(() => {
        if (!isModalOpen) return;
        if (status === 'running' || status === 'paused') {
            setView('active');
        } else if (status === 'completed') {
            setView('completed');
        } else {
            setView('setup');
        }
    }, [isModalOpen, status]);

    const handleClose = () => {
        closeModal();
        // Don't cancel if timer is running/paused — it should keep running
    };

    const handleCancel = () => {
        cancelTimer();
        setView('setup');
    };

    return (
        <Modal
            visible={isModalOpen}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <View style={[m.container, { backgroundColor: theme.bg }]}>
                {/* Handle bar */}
                <View style={m.handleArea}>
                    <View style={[m.handle, { backgroundColor: theme.border }]} />
                </View>

                {/* Close button */}
                <Pressable style={[m.closeBtn, { backgroundColor: theme.surface2 }]} onPress={handleClose}>
                    <Ionicons name="close" size={18} color={theme.textSecondary} />
                </Pressable>

                {/* Views */}
                {view === 'setup' && (
                    <SetupView
                        onStart={() => setView('active')}
                        onOpenSettings={() => setView('settings')}
                    />
                )}
                {(view === 'active') && (
                    <ActiveView onCancel={handleCancel} />
                )}
                {view === 'completed' && (
                    <CompletedView
                        onContinue={() => setView('active')}
                        onClose={() => {
                            setView('setup');
                            handleClose();
                        }}
                    />
                )}
                {view === 'settings' && (
                    <SettingsView onBack={() => setView('setup')} />
                )}
            </View>
        </Modal>
    );
}

// ── Modal styles ──────────────────────────────────────────────────────────────

const m = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: Spacing.lg },
    handleArea: { alignItems: 'center', paddingTop: Spacing.md, paddingBottom: Spacing.sm },
    handle: { width: 40, height: 4, borderRadius: 99 },
    closeBtn: {
        position: 'absolute',
        top: Spacing.lg,
        right: Spacing.lg,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
});

// Setup view styles
const sv = StyleSheet.create({
    setupContent: { paddingTop: Spacing.md, paddingBottom: Spacing.xxl },
    setupHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    setupTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    settingsBtn: { padding: 4 },
    label: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
    modeRow: { flexDirection: 'row', gap: 8, marginBottom: Spacing.lg },
    modeChip: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: Radius.full,
        borderWidth: 1.5,
        alignItems: 'center',
    },
    modeChipText: { fontSize: 12, fontWeight: '700' },
    durationCard: {
        borderRadius: Radius.xl,
        borderWidth: 1,
        paddingVertical: Spacing.xl,
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    durationTime: { fontSize: 56, fontWeight: '800', letterSpacing: -2, fontVariant: ['tabular-nums'] },
    durationLabel: { fontSize: 14, fontWeight: '500', marginTop: 4, opacity: 0.8 },
    linkedTask: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: Radius.md,
        borderWidth: 1.5,
        marginBottom: Spacing.lg,
    },
    linkedTaskText: { flex: 1, fontSize: 14, fontWeight: '500', marginRight: 8 },
    taskPickerBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: Radius.md,
        borderWidth: 1,
        marginBottom: Spacing.sm,
    },
    taskPickerBtnText: { fontSize: 14 },
    taskActionRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: Spacing.sm,
    },
    taskActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 11,
        paddingHorizontal: 12,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    taskActionBtnText: { fontSize: 13, fontWeight: '600' },
    newTaskBox: {
        borderRadius: Radius.lg,
        borderWidth: 1,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
        gap: 12,
    },
    newTaskInput: {
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: 12,
        fontSize: 15,
    },
    newTaskActions: {
        flexDirection: 'row',
        gap: 8,
    },
    newTaskCancel: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: Radius.md,
        borderWidth: 1,
    },
    newTaskCancelText: { fontSize: 14, fontWeight: '600' },
    newTaskCreate: {
        flex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        borderRadius: Radius.md,
    },
    newTaskCreateText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    catChipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
    },
    catChip: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: Radius.full,
        borderWidth: 1,
    },
    catChipText: { fontSize: 12, fontWeight: '600' },
    searchInput: {
        borderWidth: 1,
        borderRadius: Radius.md,
        padding: 12,
        fontSize: 14,
        marginBottom: Spacing.sm,
    },
    taskList: {
        borderRadius: Radius.md,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: Spacing.lg,
    },
    taskOption: { paddingVertical: 12, paddingHorizontal: Spacing.md, borderBottomWidth: 1 },
    taskOptionText: { fontSize: 14 },
    emptyTasks: { fontSize: 13, marginBottom: Spacing.lg, textAlign: 'center' },
    startBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        borderRadius: Radius.full,
        marginTop: Spacing.md,
    },
    startBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});

// Active view styles
const av = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.xxl },
    modeBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full, marginBottom: 8 },
    modeBadgeText: { fontSize: 13, fontWeight: '700' },
    sessionLabel: { fontSize: 14, fontWeight: '500', marginBottom: Spacing.xl },
    ringWrapper: { width: RING_SIZE, height: RING_SIZE, marginBottom: Spacing.xl },
    timeDisplay: {
        fontSize: 64,
        fontWeight: '800',
        letterSpacing: -3,
        fontVariant: ['tabular-nums'],
    },
    linkedTaskText: { fontSize: 13, marginTop: 8, maxWidth: RING_SIZE - 40, textAlign: 'center' },
    controls: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    controlBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: Radius.lg,
        borderWidth: 1,
    },
    controlBtnText: { fontSize: 11, fontWeight: '600' },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 18,
        paddingHorizontal: 28,
        borderRadius: Radius.full,
    },
    primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// Completed view styles
const cv = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: Spacing.xxl, paddingHorizontal: Spacing.md },
    emoji: { marginBottom: 16 },
    emojiText: { fontSize: 72 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -1, marginBottom: 12, textAlign: 'center' },
    message: { fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
    mainBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: Radius.full,
        width: '100%',
        marginBottom: 16,
    },
    mainBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
    skipBtn: { paddingVertical: 12 },
    skipText: { fontSize: 15, fontWeight: '500' },
});

// Settings view styles
const sfv = StyleSheet.create({
    container: { paddingTop: Spacing.sm, paddingBottom: Spacing.xxl },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.xl },
    backBtn: { padding: 4 },
    title: { fontSize: 18, fontWeight: '700' },
    section: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
    field: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    fieldLabel: { fontSize: 15 },
    fieldRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    input: {
        width: 52,
        textAlign: 'center',
        fontSize: 18,
        fontWeight: '700',
        padding: 6,
        borderRadius: Radius.sm,
        borderWidth: 1.5,
        fontVariant: ['tabular-nums'],
    },
    unit: { fontSize: 13 },
    toggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    toggleLabel: { fontSize: 15 },
    saveBtn: {
        marginTop: Spacing.xl,
        paddingVertical: 18,
        borderRadius: Radius.full,
        alignItems: 'center',
    },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
