import { normalizeSettings } from "./settingData";
import { Message, sendMessageToPopup } from "./message";
import { applySettingsToVideo, detectVideoAspectRatio } from "./video";

console.log("YouTube Aspect Ratio content script loaded!");


function sendDetectedRatio() {
    try {
        const ratio = detectVideoAspectRatio();
        sendMessageToPopup({ type: "DETECTED_RATIO_UPDATED", ratio });
    } catch (error) {
        console.warn("Failed to detect video aspect ratio", error);
    }
}

/*
function bindDetectedRatioUpdates() {
    const video = getVideo();

    video.addEventListener("loadedmetadata", sendDetectedRatio);

    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
        sendDetectedRatio();
    }
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindDetectedRatioUpdates, { once: true });
} else {
    bindDetectedRatioUpdates();
}*/

function messageHandler(message: Message) {
    console.log("Received message in content script", message);

    if (message.type === "REQUEST_DETECTED_RATIO") {
        sendDetectedRatio();
        return;
    }
    
    if (message.type === "SETTINGS_UPDATED") {
        const detectedRatio = detectVideoAspectRatio();
        const settings = normalizeSettings(message.settings, detectedRatio);
        console.log("Normalized settings", settings);
        applySettingsToVideo(settings);

        sendDetectedRatio();
    }
}

chrome.runtime.onMessage.addListener(messageHandler);
