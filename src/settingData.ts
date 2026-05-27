import { parseRatio } from "./ratio";

export type RawSettings = {
    enabled: boolean;
    sourceRatio: {
        mode: string;
        customX: string;
        customY: string;
    };
    targetRatio: {
        mode: string;
        customX: string;
        customY: string;
    };
    scalingMode: {
        mode: string;
        manualScale: string;
    };
};

export type Settings = {
    enabled: false;
} | {
    enabled: true;
    sourceRatio: number;
    targetRatio: number;
    scalingMode: "showAll" | "coverAll" | "manual";
    manualScale: number;
};

export function generateDefaultSetting(): RawSettings {
    return {
        enabled: true,
        sourceRatio: {
            mode: "auto",
            customX: "16",
            customY: "9"
        },
        targetRatio: {
            mode: "16:9",
            customX: "16",
            customY: "9"
        },
        scalingMode: {
            mode: "showAll",
            manualScale: "100"
        }
    };
}

export function normalizeSettings(rawSettings: RawSettings, detectedRatio: number): Settings {
    if (!rawSettings.enabled) {
        return { enabled: false };
    }

    const sourceRatio = rawSettings.sourceRatio.mode === "auto" ? detectedRatio
        : parseRatio(rawSettings.sourceRatio.mode === "custom"
            ? rawSettings.sourceRatio.customX + ":" + rawSettings.sourceRatio.customY
            : rawSettings.sourceRatio.mode
        );

    const targetRatio = parseRatio(rawSettings.targetRatio.mode === "custom"
        ? rawSettings.targetRatio.customX + ":" + rawSettings.targetRatio.customY
        : rawSettings.targetRatio.mode
    );

    const mode = rawSettings.scalingMode.mode;

    if (mode !== "manual" && mode !== "showAll" && mode !== "coverAll") {
        throw new Error(`Invalid scaling mode: ${mode}`);
    }

    return {
        enabled: true,
        sourceRatio,
        targetRatio,
        scalingMode: mode,
        manualScale: mode === "manual" ? parseFloat(rawSettings.scalingMode.manualScale) / 100 : 1
    };
}