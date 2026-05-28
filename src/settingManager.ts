import { generateDefaultSetting, RawSettings } from "./settingData";
declare const chrome: any;

async function loadGlobalSettings(): Promise<RawSettings> {
    const result = await chrome.storage.sync.get("globalSettings");
    const globalSettings = result.globalSettings || generateDefaultSetting();

    // global settings は rememberを強制的にfalseにする。
    return { ...globalSettings, remember: false };
}

async function loadURLSettings(url: string): Promise<RawSettings | null> {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = (result.urlSettings || {})[url] || null;
    if (!urlSettings) return null;

    // URL-specific settings は rememberを強制的にtrueにする。
    return { ...urlSettings, remember: true };
}

export async function saveSettings(settings: RawSettings) {
    await chrome.storage.sync.set({ globalSettings: settings });
}

export async function rememberSettings(url: string, settings: RawSettings) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = result.urlSettings || {};
    urlSettings[url] = settings;
    await chrome.storage.sync.set({ urlSettings });
}

export async function forgetSettings(url: string) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = result.urlSettings || {};
    delete urlSettings[url];
    await chrome.storage.sync.set({ urlSettings });
}

/*
export async function isRemenberedURL(url: string): Promise<boolean> {
    const settings = await loadURLSettings(url);
    return settings !== null;
}
*/

export async function loadSettings(url: string): Promise<RawSettings> {
    try {
        const urlSettings = await loadURLSettings(url);
        if (urlSettings) {
            console.log("URL-specific settings found, using them", urlSettings);
            return urlSettings;
        }

        const globalSettings = await loadGlobalSettings();
        console.log("Settings loaded successfully");
        return globalSettings;

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