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
            customX: "1",
            customY: "1"
        },
        targetRatio: {
            mode: "original",
            customX: "1",
            customY: "1"
        },
        scalingMode: {
            mode: "showAll",
            manualScale: "100"
        }
    };
}

// sourceRatioのmodeを解釈して実際の比率を返す
// mode="auto" → detectedRatio
// mode="custom" → customX/customY
// mode="4:3"など → 1.333333など
// その他 → エラー
function normalizeSourceRatio(mode: string, customX: string, customY: string, detectedRatio: number,): number {
    switch (mode) {
        case "auto":
            return detectedRatio;
        case "custom":
            // 0除算などはparseRatioの中で例外が出る
            return parseRatio(customX + ":" + customY);
        default: 
            try {
                return parseRatio(mode); // '4:3', '16:9', etc.
            } catch {
                throw new Error(`unknown source ratio mode: ${mode}`);
            }
    }
}

// targetRatioのmodeを解釈して実際の比率を返す
// mode="original" → sourceRatio
// mode="custom" → customX/customY
// mode="4:3"など → 1.333333など
// その他 → エラー
function normalizeTargetRatio(mode: string, customX: string, customY: string, sourceRatio: number): number {
    switch (mode) {
        case "original":
            return sourceRatio;
        case "custom":
            // 0除算などはparseRatioの中で例外が出る
            return parseRatio(customX + ":" + customY);
        default:
            try {
                return parseRatio(mode); // '4:3', '16:9', etc.
            } catch {
                throw new Error(`unknown target ratio mode: ${mode}`);
            }
    }
}


export function normalizeSettings(rawSettings: RawSettings, detectedRatio: number): Settings {
    if (!rawSettings.enabled) {
        return { enabled: false };
    }

    const sourceRatio = normalizeSourceRatio(
        rawSettings.sourceRatio.mode,
        rawSettings.sourceRatio.customX,
        rawSettings.sourceRatio.customY,
        detectedRatio
    );

    const targetRatio = normalizeTargetRatio(
        rawSettings.targetRatio.mode,
        rawSettings.targetRatio.customX,
        rawSettings.targetRatio.customY,
        sourceRatio
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