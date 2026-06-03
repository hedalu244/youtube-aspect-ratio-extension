import { getActiveTab, getAllYoutubeTabs } from "./tabs";

declare const chrome: any;

export type MessageToContent = {
    type: "SETTINGS_UPDATED";
} | {
    type: "REQUEST_DETECTED_RATIO";
};

export type MessageToPopup = {
    type: "DETECTED_RATIO";
    ratio: number;
} | {
    type: "ACTIVE_URL";
    url: string;
};

// activeなタブのcontent scriptにメッセージを送る。
export async function sendMessageToActiveTab(message: MessageToContent) {
    try {
        const activeTab = await getActiveTab();
        await chrome.tabs.sendMessage(activeTab.id, message);
    } catch (error) {
        console.warn("Failed to send message to content script", message, error);
    }
}

// すべてのタブのcontent scriptにメッセージを送る。
export async function sendMessageToAllTabs(message: MessageToContent) {
    const tabs = await getAllYoutubeTabs();

    for (const tab of tabs) {
        try {
            await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
            console.warn("Failed to send message to content script", { tabId: tab.id, message, error });
        }
    }
}

// popup scriptにメッセージを送る。
export async function sendMessageToPopup(message: MessageToPopup) {
    try {
        void chrome.runtime.sendMessage(message);
    } catch (error) {
        console.warn("Failed to send message to popup script", message, error);
    }
}