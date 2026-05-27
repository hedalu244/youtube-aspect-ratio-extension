import { RawSettings } from "./settingData";

export type Message = {
    type: "SETTINGS_UPDATED";
    settings: RawSettings;
} | {
    type: "REQUEST_DETECTED_RATIO";
} | {
    type: "DETECTED_RATIO_UPDATED";
    ratio: number;
};

export async function sendMessageToActiveTab(message: Message) {
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

export async function sendMessageToPopup(message: Message) {
    try {
        void chrome.runtime.sendMessage(message);
    } catch (error) {
        console.warn("Failed to send message to popup script", message, error);
    }
}