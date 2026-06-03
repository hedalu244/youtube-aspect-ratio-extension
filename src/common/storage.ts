import { generateDefaultSetting, Settings, sanitizeSettings } from "./settings";
declare const chrome: any;

// globalな設定をロードする。存在しなかったときはデフォルトの設定を返す。戻り値は必ずremember: falseである。
async function loadGlobalSettings(): Promise<Settings> {
    const result = await chrome.storage.sync.get("globalSettings");
    const globalSettings = result.globalSettings;

    // global settings は rememberを強制的にfalseにする。
    return { ...sanitizeSettings(globalSettings), remember: false };
}

// URLに紐づいた設定をロードする。戻り値は必ずremember: trueである。存在しなかったときはnullを返す。
async function loadURLSettings(url: string): Promise<Settings | null> {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = (result.urlSettings || {})[url];

    if (!urlSettings) return null
    return { ...sanitizeSettings(urlSettings), remember: true };
}

// 現在のURLに対する設定をロードする。URLに紐づいた設定が存在すればそれを、なければglobalな設定を返す。
export async function loadCurrentSettings(url: string): Promise<Settings> {
    try {
        return await loadURLSettings(url) || await loadGlobalSettings();
    } catch (error) {
        console.warn("Failed to load settings", error);
        return generateDefaultSetting();
    }
}

// globalな設定を保存する。
async function saveGlobalSettings(settings: Settings) {
    await chrome.storage.sync.set({ globalSettings: settings });
}

// URLに紐づいた設定を保存する。
async function rememberSettings(url: string, settings: Settings) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = result.urlSettings || {};
    urlSettings[url] = settings;
    await chrome.storage.sync.set({ urlSettings });
}

// URLに紐づいた設定を削除する。
async function forgetSettings(url: string) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = result.urlSettings || {};
    delete urlSettings[url];
    await chrome.storage.sync.set({ urlSettings });
}

// 現在のURLに対する設定を保存する。settings.rememberがtrueならURLに紐づいた設定として保存し、falseならURLに紐づいた設定を削除し、globalな設定として保存する。
export async function saveCurrentSettings(url: string, settings: Settings) {
    if (settings.remember) {
        await rememberSettings(url, settings);
    } else {
        await forgetSettings(url);
        await saveGlobalSettings(settings);
    }
}