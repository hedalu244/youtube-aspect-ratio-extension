declare const chrome: any;
/*
export declare namespace chrome.tabs {
    namespace Tab {
        interface Tab {
            id?: number;
            url?: string;
        }
    }
    function sendMessage(tabId: number, message: any): Promise<void>;
    function query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<chrome.tabs.Tab[]>;
}
*/

export async function getActiveTab() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs.length === 0 || !tabs[0].id) {
        throw new Error("No active tab found");
    }
    return tabs[0];
}

export async function getActiveTabURL() : Promise<string> {
    const tab = await getActiveTab();
    return tab.url;
}

export function isYouTubeURL(url: string): boolean {
    const urlObj = new URL(url);
    return urlObj.hostname === "www.youtube.com" || urlObj.hostname === "youtube.com";
}

export async function getAllYoutubeTabs(): Promise<any[]> {
    const tabs = await chrome.tabs.query({})
    return tabs.filter((tab: any) => tab.id && tab.url && isYouTubeURL(tab.url));
}