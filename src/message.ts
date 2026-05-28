import { RawSettings } from "./settingData";
declare const chrome: any;

export type MessagePtoC = {
    type: "SETTINGS_UPDATED";
    settings: RawSettings;
} | {
    type: "REQUEST_DETECTED_RATIO";
} | {
    type: "REQUEST_CURRENT_SETTINGS";
} | {
    type: "REQUEST_APPLY_SETTINGS";
};

export type MessageCtoP = {
    type: "DETECTED_RATIO";
    ratio: number;
} | {
    type: "CURRENT_SETTINGS";
    settings: RawSettings;
};

export async function sendMessageToActiveTab(message: MessagePtoC) {
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

export async function sendMessageToPopup(message: MessageCtoP) {
    try {
        void chrome.runtime.sendMessage(message);
    } catch (error) {
        console.warn("Failed to send message to popup script", message, error);
    }
}