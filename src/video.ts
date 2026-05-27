import { Settings } from "./settingData";

function getVideo(): HTMLVideoElement {
    const video = document.querySelector("video");
    if (!video) {
        throw new Error("No video element found");
    }
    return video;
}

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
    console.log(`Applied scale x:${scaleX} y:${scaleY}`);
}

export function applySettingsToVideo(settings: Settings) {
    if (!settings.enabled) {
        applyScale(getVideo(), 1, 1);
    } else {
        const [scaleX, scaleY] = computeScale(settings.sourceRatio, settings.targetRatio, settings.scalingMode, settings.manualScale);
        applyScale(getVideo(), scaleX, scaleY);
    }
}

export function detectVideoAspectRatio(): number {
    const video = getVideo();
    return video.videoWidth / video.videoHeight;
}
