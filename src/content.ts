import { generateDefaultSetting } from "./settingData";
import { MessagePtoC, sendMessageToPopup } from "./message";
import { applySettingsToVideo, detectVideoAspectRatio, getVideo } from "./video";
import { loadGlobalSettings, saveGlobalSettings } from "./storage";
declare const chrome: any;

console.log("YouTube Aspect Ratio content script loaded!");

let currentSettings = generateDefaultSetting();

function messageHandler(message: MessagePtoC) {
    console.log("Received message in content script", message);

    if (message.type === "REQUEST_DETECTED_RATIO") {
        sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectVideoAspectRatio() });

        return;
    }
    if (message.type === "REQUEST_CURRENT_SETTINGS") {
        sendMessageToPopup({ type: "CURRENT_SETTINGS", settings: currentSettings });
        return;
    }

    if (message.type === "REQUEST_APPLY_SETTINGS") {
        applySettingsToVideo(currentSettings);
        return;
    }

    if (message.type === "SETTINGS_UPDATED") {
        currentSettings = message.settings;
        applySettingsToVideo(currentSettings);

        saveGlobalSettings(currentSettings).catch(error => {
            console.warn("Failed to save settings", error);
        });

        // sendDetectedRatio();
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

function loadSettings() {
    loadGlobalSettings().then(loadedSettings => {
        currentSettings = loadedSettings;
        console.log("Settings loaded successfully");
    }).catch(error => {
        console.warn("Failed to load settings", error);
    });
}

function startObserveVideo(): boolean {
    const video = getVideo();

    if (!video) return false;

    applySettingsToVideo(currentSettings, video);

    video.addEventListener("loadedmetadata", () => applySettingsToVideo(currentSettings, video));

    const observer = new MutationObserver(() => { applySettingsToVideo(currentSettings, video); });
    observer.observe(video, { attributes: true });

    return true;
}

function waitForNewVideo() {
    if (startObserveVideo()) return; // 最初から動画がある場合はそれを監視して終わり

    const observer = new MutationObserver(() => {
        if (startObserveVideo()) observer.disconnect(); // 一つ動画が見つかったらdocumentの監視をやめる
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

loadSettings();
waitForNewVideo();

// YouTubeのページ遷移完了イベントを待ち受ける
document.addEventListener("yt-navigate-finish", waitForNewVideo); 
