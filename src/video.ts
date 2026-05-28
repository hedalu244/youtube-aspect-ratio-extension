import { normalizeSettings, RawSettings } from "./settingData";

function computeScale(sourceRatio: number, targetRatio: number, mode: "showAll" | "coverAll" | "manual", manualScale = 1): [number, number] {
    if (mode === "showAll") {
        if (sourceRatio < targetRatio) {
            return [1, sourceRatio / targetRatio];
        } else {
            return [targetRatio / sourceRatio, 1];
        }
    } else if (mode === "coverAll") {
        if (sourceRatio < targetRatio) {
            return [targetRatio / sourceRatio, 1];
        } else {
            return [1, sourceRatio / targetRatio];
        }
    } else { // if (mode === "manual")
        const r = Math.sqrt(targetRatio / sourceRatio);
        return [manualScale * r, manualScale / r];
    }
}

function applyScale(video: HTMLVideoElement, scaleX: number, scaleY: number) {
    video.style.transform = `scale(${scaleX}, ${scaleY})`;
    console.log(`Applied scale x:${scaleX} y:${scaleY} to `, video);
}

export function applySettingsToVideo(settings: RawSettings, video: HTMLVideoElement) {
    const s = normalizeSettings(settings, detectVideoAspectRatio(video));
    console.log("Normalized settings", s);
    if (!s.enabled) {
        applyScale(video, 1, 1);
    } else {
        const [scaleX, scaleY] = computeScale(s.sourceRatio, s.targetRatio, s.scalingMode, s.manualScale);
        applyScale(video, scaleX, scaleY);
    }
}

export function detectVideoAspectRatio(video: HTMLVideoElement | null): number {
    if (!video) {
        console.warn("Cannot detect video aspect ratio because video element is not found. Defaulting to 16:9.");
        return 16 / 9;
    }

    if (video.videoHeight === 0 || video.videoWidth === 0) {
        console.warn("Video metadata not loaded yet, cannot detect aspect ratio. Defaulting to 16:9.");
        return 16 / 9;
    }

    return video.videoWidth / video.videoHeight;
}
