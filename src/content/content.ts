import { MessageToContent } from "../common/message";
import { applySettingsToAllVideos, observeDocument } from "./videoDetector";
import { sendDetectedRatioToPopup } from "./mainVideoDetector";
import { loadCurrentSettings } from "../common/storage";

declare const chrome: any;

console.log("YouTube Aspect Ratio content script loaded!");

async function messageHandler(message: MessageToContent) {
    console.log("Received message in content script", message);

    switch (message.type) {
        case "REQUEST_DETECTED_RATIO":
            sendDetectedRatioToPopup();
            break;
        case "SETTINGS_UPDATED":
            const settings = await loadCurrentSettings(window.location.href);
            applySettingsToAllVideos(settings);
            break;
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

observeDocument();
