declare const chrome: any;

type Message = {
    type: "SETTINGS_UPDATED";
    settings: RawSettings;
};

type RawSettings = {
    enabled: boolean;
    sourceRatio: {
        mode: string;
        customX: number;
        customY: number;
    };
    targetRatio: {
        mode: string;
        customX: number;
        customY: number;
    };
    scalingMode: {
        mode: string;
        manualScale: number;
    };
};

type Settings = {
    enabled: false;
} | {
    enabled: true;
    sourceRatio: number;
    targetRatio: number;
    scalingMode: {
        mode: "showAll";
    } | {
        mode: "coverAll";
    } | {
        mode: "manual";
        scale: number;
    };
};