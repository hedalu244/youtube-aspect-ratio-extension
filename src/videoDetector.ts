import { updateMainVideo } from "./mainVideoDetector";
import { getCurrentSettings } from "./settingManager";
import { applySettingsToVideo } from "./video";

let currentVideos: HTMLVideoElement[] = [];

// 新しいvideo要素を見つけたときの処理
function handleNewVideo(video: HTMLVideoElement) {
    const handler = () => {
        updateMainVideo();
        applySettingsToVideo(getCurrentSettings(), video);
    };

    // メタデータの読み込み時（動画サイズ確定時）にhandlerを呼ぶ
    video.addEventListener("loadedmetadata", handler);
    // すでにメタデータが読み込まれている場合、loadedmetadataは以降発火しないので、一度呼んでおく
    handler();
    // 以降、変更があったときにも呼ぶ
    new MutationObserver(handler).observe(video, { attributes: true });
}

function handleRemovedVideo(video: HTMLVideoElement) {
    // observerを破棄するなどの処理が必要かもしれないが、とりあえずは何もしない
}

// ページ内のvideo要素を監視する
export function observeDocument() {
    const observer = new MutationObserver(() => {
        // 削除されたものを処理
        for (const video of currentVideos) {
            if (!video.isConnected) {
                handleRemovedVideo(video); 
            }
        }
        currentVideos = currentVideos.filter(video => video.isConnected);

        // 追加されたものを処理
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

export function applySettingsToAllVideos() {
    for (const video of currentVideos) applySettingsToVideo(getCurrentSettings(), video);
}