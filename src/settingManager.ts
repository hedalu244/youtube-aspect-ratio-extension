import { generateDefaultSetting, RawSettings } from "./settingData";
declare const chrome: any;

// globalな設定をロードする。存在しなかったときはデフォルトの設定を返す。これらは必ずremember: falseである。
async function loadGlobalSettings(): Promise<RawSettings> {
    const result = await chrome.storage.sync.get("globalSettings");
    const globalSettings = result.globalSettings || generateDefaultSetting();

    // global settings は rememberを強制的にfalseにする。
    return { ...globalSettings, remember: false };
}

// URLに紐づいた設定をロードする。これはremember: trueである。存在しなかったときはnullを返す。
async function loadURLSettings(url: string): Promise<RawSettings | null> {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = (result.urlSettings || {})[url] || null;
    if (!urlSettings) return null;

    return { ...urlSettings, remember: true };
}

// globalな設定を保存する。
export async function saveGlobalSettings(settings: RawSettings) {
    await chrome.storage.sync.set({ globalSettings: settings });
}

// URLに紐づいた設定を保存する。
export async function rememberSettings(url: string, settings: RawSettings) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = result.urlSettings || {};
    urlSettings[url] = settings;
    await chrome.storage.sync.set({ urlSettings });
}

// URLに紐づいた設定を削除する。
export async function forgetSettings(url: string) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = result.urlSettings || {};
    delete urlSettings[url];
    await chrome.storage.sync.set({ urlSettings });
}

// 現在のURLに対する設定をロードする。URLに紐づいた設定が存在すればそれを、なければglobalな設定を返す。
export async function loadCurrentSettings(url: string): Promise<RawSettings> {
    try {
        const urlSettings = await loadURLSettings(url);
        if (urlSettings) { return urlSettings; }

        const globalSettings = await loadGlobalSettings();
        return globalSettings;
    } catch (error) {
        console.warn("Failed to load settings", error);
        return generateDefaultSetting();
    }
}