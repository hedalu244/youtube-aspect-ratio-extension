import { MessageToContent, sendMessageToPopup } from "./message";
import { forgetSettings, loadCurrentSettings, rememberSettings } from "./settingManager";
import { applySettingsToAllVideos, observeDocument } from "./videoDetector";
import { detectMainAspectRatio } from "./mainVideoDetector";

declare const chrome: any;

console.log("YouTube Aspect Ratio content script loaded!");

export function sendDetectedRatioToPopup() {
    sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectMainAspectRatio() });
}

async function messageHandler(message: MessageToContent) {
    console.log("Received message in content script", message);

    switch (message.type) {
        case "REQUEST_DETECTED_RATIO":
            sendDetectedRatioToPopup();
            break;
        case "SETTINGS_UPDATED":
            applySettingsToAllVideos();
            break;
        case "REQUEST_REMEMBER_SETTINGS":
            rememberSettings(window.location.href, message.settings);
            break;
        case "REQUEST_FORGET_SETTINGS":
            forgetSettings(window.location.href);
            break;
        case "REQUEST_CURRENT_SETTINGS":
            const settings = await loadCurrentSettings(window.location.href);
            sendMessageToPopup({ type: "CURRENT_SETTINGS", settings });
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

observeDocument();
