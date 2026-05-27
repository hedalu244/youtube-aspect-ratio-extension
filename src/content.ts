console.log("YouTube Aspect Ratio content script loaded");

window.addEventListener("load", () => {
    console.log("Window loaded");
});

function parseRatio(str: string): number {
    const splited = str.split(":");
    if (splited.length !== 2) {
        throw new Error(`Invalid ratio format: ${str}`);
    }

    const [x, y] = splited.map(Number);
    const ans = x / y;

    if (isNaN(ans) || !isFinite(ans)) {
        throw new Error(`Invalid ratio numbers: ${str}`);
    }

    return ans;
}

function getVideo(): HTMLVideoElement {
    const video = document.querySelector("video");
    if (!video) {
        throw new Error("No video element found");
    }
    return video;
}

function detectVideoAspectRatio(): number {
    const video = getVideo();
    return video.videoWidth / video.videoHeight;
}

function normalizeSettings(rawSettings: RawSettings): Settings {
    if (!rawSettings.enabled) {
        return { enabled: false };
    }

    const sourceRatio = rawSettings.sourceRatio.mode === "auto" ? detectVideoAspectRatio()
        : parseRatio(rawSettings.sourceRatio.mode === "custom"
            ? rawSettings.sourceRatio.customX + ":" + rawSettings.sourceRatio.customY
            : rawSettings.sourceRatio.mode
        );

    const targetRatio = parseRatio(rawSettings.targetRatio.mode === "custom"
        ? rawSettings.targetRatio.customX + ":" + rawSettings.targetRatio.customY
        : rawSettings.targetRatio.mode
    );

    const mode = rawSettings.scalingMode.mode;

    if (mode !== "manual" && mode !== "showAll" && mode !== "coverAll") {
        throw new Error(`Invalid scaling mode: ${mode}`);
    }

    return {
        enabled: true,
        sourceRatio,
        targetRatio,
        scalingMode: mode,
        manualScale: mode === "manual" ? parseFloat(rawSettings.scalingMode.manualScale) / 100 : 1
    };
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
}

chrome.runtime.onMessage.addListener((message: Message) => {
    if (message.type === "SETTINGS_UPDATED") {
        const settings = normalizeSettings(message.settings);
        console.log("Normalized settings", settings);

        if (!settings.enabled) {
            applyScale(getVideo(), 1, 1);
            return;
        } else {
            const [scaleX, scaleY] = computeScale(settings.sourceRatio, settings.targetRatio, settings.scalingMode, settings.manualScale);
            applyScale(getVideo(), scaleX, scaleY);
            console.log(`Applied scale: ${scaleX}x${scaleY}`);
        }
    }
});
