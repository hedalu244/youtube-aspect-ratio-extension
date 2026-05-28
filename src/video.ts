import { normalizeSettings, RawSettings } from "./settingData";


// <video>のアスペクト比を検出する。metadataが読み込まれていないときは16:9を返す。
export function detectVideoAspectRatio(video: HTMLVideoElement): number {
    if (video.videoHeight === 0 || video.videoWidth === 0) {
        return 16 / 9;
    }

    return video.videoWidth / video.videoHeight;
}

function detectWrapperAspectRatio(video: HTMLVideoElement): number {
    const wrapper = video.closest("#movie_player") as HTMLElement | null;
    if (!wrapper) {
        return detectVideoAspectRatio(video);
    }

    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    return width / height;
}

// sourceRatioとtargetRatio、modeをもとにscaleXとscaleYを計算する。
function computeScale(sourceRatio: number, targetRatio: number, wrapperRatio: number, mode: "showAll" | "coverAll" | "manual", manualScale = 1): [number, number] {
    if (mode === "manual") {
        const r = Math.sqrt(targetRatio / sourceRatio);
        return [manualScale * r, manualScale / r];
    }

    const scaleX_fitWidth = Math.max(1, wrapperRatio / sourceRatio);
    const scaleY_fitHeight = Math.min(1, wrapperRatio / sourceRatio);

    switch (mode) {
        case "showAll": {
            const scaleX = Math.min(scaleX_fitWidth, scaleY_fitHeight * targetRatio / sourceRatio);
            const scaleY = scaleX * sourceRatio / targetRatio;
            return [scaleX, scaleY];
        }
        case "coverAll": {
            const scaleX = Math.max(scaleX_fitWidth, scaleY_fitHeight * targetRatio / sourceRatio);
            const scaleY = scaleX * sourceRatio / targetRatio;
            return [scaleX, scaleY];
        }
    }
}

// <video> にscaleを適用する。
function applyScale(video: HTMLVideoElement, scaleX: number, scaleY: number) {
    video.style.transform = `scale(${scaleX}, ${scaleY})`;
    console.log(`Applied scale x:${scaleX} y:${scaleY}`);
}

// <video> に設定を適用する。
export function applySettingsToVideo(rawSettings: RawSettings, video: HTMLVideoElement) {
    const settings = normalizeSettings(rawSettings, detectVideoAspectRatio(video));
    if (!settings.enabled) {
        applyScale(video, 1, 1);
    } else {
        const wrapperRatio = detectWrapperAspectRatio(video);
        const [scaleX, scaleY] = computeScale(settings.sourceRatio, settings.targetRatio, wrapperRatio, settings.scalingMode, settings.manualScale);
        applyScale(video, scaleX, scaleY);
    }
}