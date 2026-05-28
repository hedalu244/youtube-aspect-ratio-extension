import { MessageToContent, sendMessageToPopup } from "./message";
import { loadSettings, setCurrentSettings, getCurrentSettings } from "./settingManager";
import { applySettingsToAllVideos, observeDocument } from "./videoDetector";
import { detectMainAspectRatio } from "./mainVideoDetector";

declare const chrome: any;

console.log("YouTube Aspect Ratio content script loaded!");

export function sendDetectedRatioToPopup() {
    sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectMainAspectRatio() });
}

function sendCurrentSettingsToPopup() {
    sendMessageToPopup({ type: "CURRENT_SETTINGS", settings: getCurrentSettings() });
}

function messageHandler(message: MessageToContent) {
    console.log("Received message in content script", message);

    switch (message.type) {
        case "REQUEST_DETECTED_RATIO":
            sendDetectedRatioToPopup();
            break;
        case "REQUEST_CURRENT_SETTINGS":
            sendCurrentSettingsToPopup();
            break;
        case "REQUEST_APPLY_SETTINGS":
            applySettingsToAllVideos();
            break;
        case "SETTINGS_UPDATED":
            setCurrentSettings(message.settings);
            applySettingsToAllVideos();
            break;
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

loadSettings();
observeDocument();
