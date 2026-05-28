import { generateDefaultSetting, RawSettings } from "./settingData";
declare const chrome: any;

let currentSettings = generateDefaultSetting();

async function loadGlobalSettings(): Promise<RawSettings> {
    const result = await chrome.storage.sync.get("globalSettings");
    return await result.globalSettings || generateDefaultSetting();
}

async function saveGlobalSettings(settings: RawSettings) {
    await chrome.storage.sync.set({
        globalSettings: settings
    });
}

export function getCurrentSettings() {
    return currentSettings;
}

export function setCurrentSettings(newSettings: RawSettings) {
    currentSettings = newSettings;

    saveGlobalSettings(currentSettings).catch(error => {
        console.warn("Failed to save settings", error);
    });
}

export function loadSettings() {
    loadGlobalSettings().then(loadedSettings => {
        currentSettings = loadedSettings;
        console.log("Settings loaded successfully");
    }).catch(error => {
        console.warn("Failed to load settings", error);
    });
}