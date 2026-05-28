import { generateDefaultSetting, RawSettings } from "./settingData";
declare const chrome: any;

async function loadGlobalSettings(): Promise<RawSettings> {
    const result = await chrome.storage.sync.get("globalSettings");
    return await result.globalSettings || generateDefaultSetting();
}

async function saveGlobalSettings(settings: RawSettings) {
    await chrome.storage.sync.set({ globalSettings: settings });
}

export async function saveSettings(settings: RawSettings) {
    await saveGlobalSettings(settings);
}

export async function loadSettings() {
    try {
        const settings = await loadGlobalSettings();
        console.log("Settings loaded successfully");
        return settings;
    } catch (error) {
        console.warn("Failed to load settings", error);
        return generateDefaultSetting();
    }
}
/*
export function getCurrentSettings() {
    return currentSettings;
}

export function setCurrentSettings(newSettings: RawSettings) {
    currentSettings = newSettings;

    saveGlobalSettings(currentSettings).catch(error => {
        console.warn("Failed to save settings", error);
    });
}*/