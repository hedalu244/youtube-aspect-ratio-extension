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
  function generateDefaultSetting() {
    return {
      enabled: true,
      sourceRatio: {
        mode: "auto",
        customX: "16",
        customY: "9"
      },
      targetRatio: {
        mode: "16:9",
        customX: "16",
        customY: "9"
      },
      scalingMode: {
        mode: "showAll",
        manualScale: "100"
      }
    };
  }
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
    console.log(`Applied scale x:${scaleX} y:${scaleY} to `, video);
  }
  function getVideo() {
    return document.querySelector("video");
  }
  function applySettingsToVideo(settings, video = null) {
    if (!video) {
      video = getVideo();
      if (!video) {
        console.warn("Cannot apply settings because video element is not found");
        return;
      }
    }
    const s = normalizeSettings(settings, detectVideoAspectRatio());
    console.log("Normalized settings", s);
    if (!s.enabled) {
      applyScale(video, 1, 1);
    } else {
      const [scaleX, scaleY] = computeScale(s.sourceRatio, s.targetRatio, s.scalingMode, s.manualScale);
      applyScale(video, scaleX, scaleY);
    }
  }
  function detectVideoAspectRatio() {
    const video = getVideo();
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

  // src/storage.ts
  async function loadGlobalSettings() {
    const result = await chrome.storage.sync.get("globalSettings");
    return await result.globalSettings || generateDefaultSetting();
  }
  async function saveGlobalSettings(settings) {
    await chrome.storage.sync.set({
      globalSettings: settings
    });
  }

  // src/content.ts
  console.log("YouTube Aspect Ratio content script loaded!");
  var currentSettings = generateDefaultSetting();
  function messageHandler(message) {
    console.log("Received message in content script", message);
    if (message.type === "REQUEST_DETECTED_RATIO") {
      sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectVideoAspectRatio() });
      return;
    }
    if (message.type === "REQUEST_CURRENT_SETTINGS") {
      sendMessageToPopup({ type: "CURRENT_SETTINGS", settings: currentSettings });
      return;
    }
    if (message.type === "REQUEST_APPLY_SETTINGS") {
      applySettingsToVideo(currentSettings);
      return;
    }
    if (message.type === "SETTINGS_UPDATED") {
      currentSettings = message.settings;
      applySettingsToVideo(currentSettings);
      saveGlobalSettings(currentSettings).catch((error) => {
        console.warn("Failed to save settings", error);
      });
    }
  }
  chrome.runtime.onMessage.addListener(messageHandler);
  function loadSettings() {
    loadGlobalSettings().then((loadedSettings) => {
      currentSettings = loadedSettings;
      console.log("Settings loaded successfully");
    }).catch((error) => {
      console.warn("Failed to load settings", error);
    });
  }
  function startObserveVideo() {
    const video = getVideo();
    if (!video) return false;
    applySettingsToVideo(currentSettings, video);
    video.addEventListener("loadedmetadata", () => applySettingsToVideo(currentSettings, video));
    const observer = new MutationObserver(() => {
      applySettingsToVideo(currentSettings, video);
    });
    observer.observe(video, { attributes: true });
    return true;
  }
  function waitForNewVideo() {
    if (startObserveVideo()) return;
    const observer = new MutationObserver(() => {
      if (startObserveVideo()) observer.disconnect();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
  loadSettings();
  waitForNewVideo();
  document.addEventListener("yt-navigate-finish", waitForNewVideo);
})();
