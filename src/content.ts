import { MessageToContent, sendMessageToPopup } from "./message";
import { loadSettings } from "./settingManager";
import { applySettingsToAllVideos, observeDocument } from "./videoDetector";
import { detectMainAspectRatio } from "./mainVideoDetector";

declare const chrome: any;

console.log("YouTube Aspect Ratio content script loaded!");

export function sendDetectedRatioToPopup() {
    sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectMainAspectRatio() });
}

function messageHandler(message: MessageToContent) {
    console.log("Received message in content script", message);

    switch (message.type) {
        case "REQUEST_DETECTED_RATIO":
            sendDetectedRatioToPopup();
            break;
        case "SETTINGS_UPDATED":
            applySettingsToAllVideos();
            break;
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

observeDocument();
