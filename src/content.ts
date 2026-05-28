import { generateDefaultSetting } from "./settingData";
import { MessagePtoC, sendMessageToPopup } from "./message";
import { applySettingsToVideo, detectVideoAspectRatio } from "./video";
import { loadGlobalSettings, saveGlobalSettings } from "./storage";
declare const chrome: any;

console.log("YouTube Aspect Ratio content script loaded!");

let currentSettings = generateDefaultSetting();
let currentVideo: HTMLVideoElement | null = null;

function apply() {
    if (!currentVideo) {
        console.warn("Cannot apply settings because video element is not found");
        return;
    }
    applySettingsToVideo(currentSettings, currentVideo);
    sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectVideoAspectRatio(currentVideo) });
}

function messageHandler(message: MessagePtoC) {
    console.log("Received message in content script", message);

    if (message.type === "REQUEST_DETECTED_RATIO") {
        sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectVideoAspectRatio(currentVideo) });
        return;
    }

    if (message.type === "REQUEST_CURRENT_SETTINGS") {
        sendMessageToPopup({ type: "CURRENT_SETTINGS", settings: currentSettings });
        return;
    }

    if (message.type === "REQUEST_APPLY_SETTINGS") {
        apply();
        return;
    }

    if (message.type === "SETTINGS_UPDATED") {
        currentSettings = message.settings;

        saveGlobalSettings(currentSettings).catch(error => {
            console.warn("Failed to save settings", error);
        });

        apply();
        return;
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

function checkNewVideo(): boolean {
    const video = document.querySelector("video");
    if (video) {
        handleNewVideo(video);
        return true;
    }
    return false;
}

// 動画要素が見つかったらそれを監視して設定を適用する。見つからなければ、動画要素が追加されるのを待つ。
function handleNewVideo(video: HTMLVideoElement) {
    currentVideo = video;

    // 即時、メタデータが読み込まれた時点、属性が変わった時点、のそれぞれでapplyを呼ぶ
    apply();
    video.addEventListener("loadedmetadata", () => apply());
    const observer = new MutationObserver(() => { apply(); });
    observer.observe(video, { attributes: true });

    // videoエレメントが消えたらwaitForNewVideoを呼ぶ
    const disconnectObserver = new MutationObserver(() => {
        if (video.isConnected) return;
        currentVideo = null;
        observer.disconnect();
        disconnectObserver.disconnect();
        waitForNewVideo();
    });
    disconnectObserver.observe(document.documentElement, { childList: true, subtree: true });
}

function waitForNewVideo() {
    if (checkNewVideo()) return; // 最初から動画がある場合はそれを監視して終わり

    const observer = new MutationObserver(() => {
        if (checkNewVideo()) observer.disconnect(); // 一つ動画が見つかったらdocumentの監視をやめる
    });
    
    observer.observe(document.documentElement, { childList: true, subtree: true });
}

loadSettings();
apply();
waitForNewVideo();

// YouTubeのページ遷移完了イベントを待ち受ける
document.addEventListener("yt-navigate-finish", waitForNewVideo); 
