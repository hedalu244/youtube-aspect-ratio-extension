import { generateDefaultSetting } from "./settingData";
import { MessagePtoC, sendMessageToPopup } from "./message";
import { applySettingsToVideo, detectVideoAspectRatio } from "./video";
import { loadGlobalSettings, saveGlobalSettings } from "./storage";
declare const chrome: any;

console.log("YouTube Aspect Ratio content script loaded!");

let currentSettings = generateDefaultSetting();
let currentVideos: HTMLVideoElement[] = [];
// detectedとして比率を測定してUIに表示するためのもの（ページ内で最大のものが良い）
let mainVideo: HTMLVideoElement | null = null;

function messageHandler(message: MessagePtoC) {
    console.log("Received message in content script", message);

    if (message.type === "REQUEST_DETECTED_RATIO") {
        sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectVideoAspectRatio(mainVideo) });
        return;
    }

    if (message.type === "REQUEST_CURRENT_SETTINGS") {
        sendMessageToPopup({ type: "CURRENT_SETTINGS", settings: currentSettings });
        return;
    }

    if (message.type === "REQUEST_APPLY_SETTINGS") {
        for (const video of currentVideos) applySettingsToVideo(currentSettings, video);
        return;
    }

    if (message.type === "SETTINGS_UPDATED") {
        currentSettings = message.settings;

        saveGlobalSettings(currentSettings).catch(error => {
            console.warn("Failed to save settings", error);
        });

        for (const video of currentVideos) applySettingsToVideo(currentSettings, video);
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

function updateMainVideo() {
    // 最大のものをmainVideoにする
    const new_videos = document.querySelectorAll("video");

    // 線形探索
    let maxArea = 0;
    let new_mainVideo: HTMLVideoElement | null = null;
    for (const video of new_videos) {
        const area = video.videoWidth * video.videoHeight;
        if (area > maxArea) {
            maxArea = area;
            new_mainVideo = video;
        }
    }

    // 変更があったときにはポップアップUIに通知（受信されるかはわからない）
    if (new_mainVideo !== mainVideo) {
        mainVideo = new_mainVideo;
        sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectVideoAspectRatio(mainVideo) });
    }
}

// 新しいvideo要素を見つけたときの処理
function handleNewVideo(video: HTMLVideoElement) {
    const handler = () => {
        applySettingsToVideo(currentSettings, video);
        updateMainVideo(); // メタデータが読み込まれてないと判定できないのでここで呼ぶ
    };

    // メタデータの読み込み時（動画サイズ確定時）に呼ぶ
    video.addEventListener("loadedmetadata", handler);
    // すでにメタデータが読み込まれている場合、loadedmetadataは以降発火しないので、一度呼んでおく
    handler();
    // 以降、変更があったときにも呼ぶ
    new MutationObserver(handler).observe(video, { attributes: true });
}

// ページ内のvideo要素を監視する
function observeDocument() {
    const observer = new MutationObserver(() => {
        const new_videos = document.querySelectorAll("video");
        for (const video of new_videos) {
            if (!currentVideos.includes(video)) {
                currentVideos.push(video);
                handleNewVideo(video);
            }
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
}

loadSettings();
observeDocument();
