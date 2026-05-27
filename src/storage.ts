import { generateDefaultSetting, RawSettings } from "./settingData";

export async function loadGlobalSettings(): Promise<RawSettings> {
    const result = await chrome.storage.sync.get("globalSettings");
    return await result.globalSettings || generateDefaultSetting();
}

export async function saveGlobalSettings(settings: RawSettings) {
    await chrome.storage.sync.set({
        globalSettings: settings
    });
}

