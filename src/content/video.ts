import { normalizeSettings, Settings } from "../common/settings";

// このモジュールでは、設定に従ってYoutubeの動画にscaleを適用する。

// <video>のアスペクト比を検出する。metadataが読み込まれていないときは16:9を返す。
export function detectVideoAspectRatio(video: HTMLVideoElement): number {
    if (video.videoHeight === 0 || video.videoWidth === 0) {
        return 16 / 9;
    }

    return video.videoWidth / video.videoHeight;
}

function detectWrapperAspectRatio(video: HTMLVideoElement): number {
    const wrapper = video.closest("#movie_player") as HTMLElement || null;
    if (!wrapper) return detectVideoAspectRatio(video);

    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    return width / height;
}

// sourceRatioとtargetRatio、modeをもとにscaleXとscaleYを計算する。
function computeScale(sourceRatio: number, targetRatio: number, videoRatio: number, wrapperRatio: number, mode: "showAll" | "coverAll" | "manual", manualScale = 1): [number, number] {
    if (mode === "manual") {
        const r = Math.sqrt(targetRatio / sourceRatio);
        return [manualScale * r, manualScale / r];
    }

    const scaleX_fitWidth = Math.max(1, videoRatio / sourceRatio) * Math.max(1, wrapperRatio / videoRatio);
    const scaleY_fitHeight = Math.max(1, sourceRatio / videoRatio) * Math.max(1, videoRatio / wrapperRatio);
    const scaleX_fitHeight = scaleY_fitHeight * targetRatio / sourceRatio;
    const scaleX = (mode == "showAll" ? Math.min : Math.max)(scaleX_fitWidth, scaleX_fitHeight);
    const scaleY = scaleX * sourceRatio / targetRatio;

    return [scaleX, scaleY];
}

// <video> にscaleを適用する。
function applyScale(video: HTMLVideoElement, scaleX: number, scaleY: number) {
    video.style.transform = `scale(${scaleX}, ${scaleY})`;
    console.log(`Applied scale x:${scaleX} y:${scaleY}`);
}

// <video> に設定を適用する。
export function applySettingsToVideo(settings: Settings, video: HTMLVideoElement) {
    const videoRatio = detectVideoAspectRatio(video);
    const wrapperRatio = detectWrapperAspectRatio(video);

    const normalizedSettings = normalizeSettings(settings, videoRatio);
    if (!normalizedSettings.enabled) {
        applyScale(video, 1, 1);
    } else {
        const [scaleX, scaleY] = computeScale(
            normalizedSettings.sourceRatio,
            normalizedSettings.targetRatio,
            videoRatio,
            wrapperRatio,
            normalizedSettings.scalingMode,
            normalizedSettings.manualScale);
        applyScale(video, scaleX, scaleY);
    }
}