declare const chrome: any;

type Message = {
    type: "SETTINGS_UPDATED";
    settings: RawSettings;
};

type RawSettings = {
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

type Settings = {
    enabled: false;
} | {
    enabled: true;
    sourceRatio: number;
    targetRatio: number;
    scalingMode: "showAll" | "coverAll" | "manual";
    manualScale: number;
};