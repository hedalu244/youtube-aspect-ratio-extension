import { parseRatio } from "./ratio";

// このモジュールでは設定データを定義し、正規化と変換のユーティリティ関数を実装する。
// Settingsはユーザーが入力したままの生の設定データで、ストレージにもこれが保存される。
// NormalizedSettingsは実際に動画のアスペクト比を計算するために必要最低限の情報だけを持ったデータ。

export type Settings = {
    enabled: boolean;

    sourceRatioMode: string;
    sourceRatioCustomX: string;
    sourceRatioCustomY: string;

    targetRatioMode: string;
    targetRatioCustomX: string;
    targetRatioCustomY: string;

    scalingMode: string;
    manualScale: string;

    remember: boolean;
};

export type NormalizedSettings = {
    enabled: false;
} | {
    enabled: true;
    sourceRatio: number;
    targetRatio: number;
    scalingMode: "showAll" | "coverAll" | "manual";
    manualScale: number;
};

// デフォルトの設定を作る
export function generateDefaultSetting(): Settings {
    return {
        enabled: true,
        sourceRatioMode: "auto",
        sourceRatioCustomX: "1",
        sourceRatioCustomY: "1",
        targetRatioMode: "original",
        targetRatioCustomX: "1",
        targetRatioCustomY: "1",
        scalingMode: "showAll",
        manualScale: "100",
        remember: false // 重要。これがtrueだとすべての動画の設定が保存されてしまい、ストレージに悪影響そう
    };
}

// 設定オブジェクトの欠けている部分をデフォルトの値で補完して正規化し、過剰な部分を削除する。
export function sanitizeSettings(rawSettings: any): Settings {
    if (typeof rawSettings !== "object" || rawSettings === null) {
        return generateDefaultSetting();
    }
    const settings = generateDefaultSetting() as any;

    for (const key in settings) {
        if (key in rawSettings && typeof rawSettings[key] === typeof settings[key]) {
            settings[key] = rawSettings[key];
        }
    }

    return settings as Settings;
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

// Settingsから不要な情報を削除して正規化する。
export function normalizeSettings(settings: Settings, detectedRatio: number): NormalizedSettings {
    if (!settings.enabled) {
        return { enabled: false };
    }

    const sourceRatio = normalizeSourceRatio(
        settings.sourceRatioMode,
        settings.sourceRatioCustomX,
        settings.sourceRatioCustomY,
        detectedRatio
    );

    const targetRatio = normalizeTargetRatio(
        settings.targetRatioMode,
        settings.targetRatioCustomX,
        settings.targetRatioCustomY,
        sourceRatio
    );

    const mode = settings.scalingMode;

    if (mode !== "manual" && mode !== "showAll" && mode !== "coverAll") {
        throw new Error(`Invalid scaling mode: ${mode}`);
    }

    return {
        enabled: true,
        sourceRatio,
        targetRatio,
        scalingMode: mode,
        manualScale: mode === "manual" ? parseFloat(settings.manualScale) / 100 : 1
    };
}