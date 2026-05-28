
import { sendDetectedRatioToPopup } from "./content";
import { detectVideoAspectRatio } from "./video";

// ページ内で最大のVideo要素。主にdetectedとして比率を測定してUIに表示するためのもの
let mainVideo: HTMLVideoElement | null = null;

export function detectMainAspectRatio() {
    if (!mainVideo) {
        console.warn("Cannot detect video aspect ratio because video element is not found. Defaulting to 16:9.");
        return 16 / 9;
    }
    return detectVideoAspectRatio(mainVideo);
}

export function updateMainVideo() {
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

    // 変更があったときにはポップアップUIに通知（開いていないときは受信されなさそうだが）
    if (new_mainVideo !== mainVideo) {
        mainVideo = new_mainVideo;
        sendDetectedRatioToPopup();
    }
}