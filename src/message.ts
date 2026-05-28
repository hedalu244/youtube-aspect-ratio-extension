import { RawSettings } from "./settingData";

declare const chrome: any;

export type MessageToContent = {
    type: "SETTINGS_UPDATED";
} | {
    type: "REQUEST_DETECTED_RATIO";
} | {
    type: "REQUEST_REMEMBER_SETTINGS";
    settings: RawSettings;
} | {
    type: "REQUEST_FORGET_SETTINGS";
} | {
    type: "REQUEST_CURRENT_SETTINGS";
};

export type MessageToPopup = {
    type: "DETECTED_RATIO";
    ratio: number;
} | {
    type: "ACTIVE_URL";
    url: string;
} | {
    type: "CURRENT_SETTINGS";
    settings: RawSettings;
};

export async function sendMessageToActiveTab(message: MessageToContent) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab?.id) {
        console.warn("No active tab found", message);
        return;
    }

    try {
        await chrome.tabs.sendMessage(activeTab.id, message);
    } catch (error) {
        console.warn("Failed to send message to content script", message, error);
    }
}


export async function sendMessageToAllTabs(message: MessageToContent) {
    const tabs = await chrome.tabs.query({ url: ["https://www.youtube.com/*"] });

    for (const tab of tabs) {
        if (!tab.id) {
            continue;
        }
        try {
            await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
            console.warn("Failed to send message to content script", { tabId: tab.id, message, error });
        }
    }
}

export async function sendMessageToPopup(message: MessageToPopup) {
    try {
        void chrome.runtime.sendMessage(message);
    } catch (error) {
        console.warn("Failed to send message to popup script", message, error);
    }
}