(() => {
  // src/ratio.ts
  function parseRatio(str) {
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

  // src/settingData.ts
  function normalizeSettings(rawSettings, detectedRatio) {
    if (!rawSettings.enabled) {
      return { enabled: false };
    }
    const sourceRatio = rawSettings.sourceRatio.mode === "auto" ? detectedRatio : parseRatio(
      rawSettings.sourceRatio.mode === "custom" ? rawSettings.sourceRatio.customX + ":" + rawSettings.sourceRatio.customY : rawSettings.sourceRatio.mode
    );
    const targetRatio = parseRatio(
      rawSettings.targetRatio.mode === "custom" ? rawSettings.targetRatio.customX + ":" + rawSettings.targetRatio.customY : rawSettings.targetRatio.mode
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

  // src/message.ts
  async function sendMessageToPopup(message) {
    try {
      void chrome.runtime.sendMessage(message);
    } catch (error) {
      console.warn("Failed to send message to popup script", message, error);
    }
  }

  // src/video.ts
  function getVideo() {
    const video = document.querySelector("video");
    if (!video) {
      throw new Error("No video element found");
    }
    return video;
  }
  function computeScale(sourceRatio, targetRatio, mode, manualScale = 1) {
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
    } else {
      const r = Math.sqrt(targetRatio / sourceRatio);
      return [manualScale * r, manualScale / r];
    }
  }
  function applyScale(video, scaleX, scaleY) {
    video.style.transform = `scale(${scaleX}, ${scaleY})`;
    console.log(`Applied scale x:${scaleX} y:${scaleY}`);
  }
  function applySettingsToVideo(settings) {
    if (!settings.enabled) {
      applyScale(getVideo(), 1, 1);
    } else {
      const [scaleX, scaleY] = computeScale(settings.sourceRatio, settings.targetRatio, settings.scalingMode, settings.manualScale);
      applyScale(getVideo(), scaleX, scaleY);
    }
  }
  function detectVideoAspectRatio() {
    const video = getVideo();
    return video.videoWidth / video.videoHeight;
  }

  // src/content.ts
  console.log("YouTube Aspect Ratio content script loaded!");
  function sendDetectedRatio() {
    try {
      const ratio = detectVideoAspectRatio();
      sendMessageToPopup({ type: "DETECTED_RATIO_UPDATED", ratio });
    } catch (error) {
      console.warn("Failed to detect video aspect ratio", error);
    }
  }
  function messageHandler(message) {
    console.log("Received message in content script", message);
    if (message.type === "REQUEST_DETECTED_RATIO") {
      sendDetectedRatio();
      return;
    }
    if (message.type === "SETTINGS_UPDATED") {
      const detectedRatio = detectVideoAspectRatio();
      const settings = normalizeSettings(message.settings, detectedRatio);
      console.log("Normalized settings", settings);
      applySettingsToVideo(settings);
      sendDetectedRatio();
    }
  }
  chrome.runtime.onMessage.addListener(messageHandler);
})();
