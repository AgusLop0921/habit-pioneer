export const MAX_LEVEL = 10;
export const XP_PER_HABIT = 10;

export interface LevelInfo {
    level: number;
    titleKey: string; // Key para usar en i18n
    xpRequired: number; // Experiencia requerida para alcanzar ESTE nivel desde el anterior (o desde 0 para nivel 1)
    totalXpRequired: number; // Experiencia total necesaria desde 0
}

// Configuración de niveles
export const LEVELS: LevelInfo[] = [
    { level: 1, titleKey: 'level.novato', xpRequired: 0, totalXpRequired: 0 },
    { level: 2, titleKey: 'level.aprendiz', xpRequired: 100, totalXpRequired: 100 },
    { level: 3, titleKey: 'level.explorador', xpRequired: 200, totalXpRequired: 300 },
    { level: 4, titleKey: 'level.caminante', xpRequired: 300, totalXpRequired: 600 },
    { level: 5, titleKey: 'level.pionero', xpRequired: 400, totalXpRequired: 1000 },
    { level: 6, titleKey: 'level.disciplinado', xpRequired: 500, totalXpRequired: 1500 },
    { level: 7, titleKey: 'level.veterano', xpRequired: 600, totalXpRequired: 2100 },
    { level: 8, titleKey: 'level.maestro', xpRequired: 700, totalXpRequired: 2800 },
    { level: 9, titleKey: 'level.leyenda', xpRequired: 800, totalXpRequired: 3600 },
    { level: 10, titleKey: 'level.supremo', xpRequired: 1000, totalXpRequired: 4600 },
];

export function calculateLevel(totalCompletedHabits: number): {
    currentLevel: LevelInfo;
    nextLevel: LevelInfo | null;
    xpCurrent: number;
    xpForNextLevel: number | null;
    xpProgressPercent: number;
    totalXp: number;
} {
    const totalXp = totalCompletedHabits * XP_PER_HABIT;

    let currentLevel = LEVELS[0];
    let nextLevel: LevelInfo | null = LEVELS[1];

    for (let i = 0; i < LEVELS.length; i++) {
        if (totalXp >= LEVELS[i].totalXpRequired) {
            currentLevel = LEVELS[i];
            nextLevel = i + 1 < LEVELS.length ? LEVELS[i + 1] : null;
        } else {
            break;
        }
    }

    let xpCurrentLevel = totalXp - currentLevel.totalXpRequired;
    let xpProgressPercent = 100;

    if (nextLevel) {
        xpProgressPercent = Math.min(100, Math.max(0, (xpCurrentLevel / nextLevel.xpRequired) * 100));
    } else {
        // Si estamos en nivel máximo (10), llenamos la barra o la mantenemos al máximo
        xpCurrentLevel = currentLevel.xpRequired; // Dummy
    }

    return {
        currentLevel,
        nextLevel,
        xpCurrent: xpCurrentLevel,
        xpForNextLevel: nextLevel ? nextLevel.xpRequired : null,
        xpProgressPercent,
        totalXp,
    };
}
