(() => {
  // src/message.ts
  async function sendMessageToPopup(message) {
    try {
      void chrome.runtime.sendMessage(message);
    } catch (error) {
      console.warn("Failed to send message to popup script", message, error);
    }
  }

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
        customX: "1",
        customY: "1"
      },
      targetRatio: {
        mode: "original",
        customX: "1",
        customY: "1"
      },
      scalingMode: {
        mode: "showAll",
        manualScale: "100"
      }
    };
  }
  function normalizeSourceRatio(mode, customX, customY, detectedRatio) {
    switch (mode) {
      case "auto":
        return detectedRatio;
      case "custom":
        return parseRatio(customX + ":" + customY);
      default:
        try {
          return parseRatio(mode);
        } catch {
          throw new Error(`unknown source ratio mode: ${mode}`);
        }
    }
  }
  function normalizeTargetRatio(mode, customX, customY, sourceRatio) {
    switch (mode) {
      case "original":
        return sourceRatio;
      case "custom":
        return parseRatio(customX + ":" + customY);
      default:
        try {
          return parseRatio(mode);
        } catch {
          throw new Error(`unknown target ratio mode: ${mode}`);
        }
    }
  }
  function normalizeSettings(rawSettings, detectedRatio) {
    if (!rawSettings.enabled) {
      return { enabled: false };
    }
    const sourceRatio = normalizeSourceRatio(
      rawSettings.sourceRatio.mode,
      rawSettings.sourceRatio.customX,
      rawSettings.sourceRatio.customY,
      detectedRatio
    );
    const targetRatio = normalizeTargetRatio(
      rawSettings.targetRatio.mode,
      rawSettings.targetRatio.customX,
      rawSettings.targetRatio.customY,
      sourceRatio
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

  // src/settingManager.ts
  var currentSettings = generateDefaultSetting();
  async function loadGlobalSettings() {
    const result = await chrome.storage.sync.get("globalSettings");
    return await result.globalSettings || generateDefaultSetting();
  }
  async function saveGlobalSettings(settings) {
    await chrome.storage.sync.set({
      globalSettings: settings
    });
  }
  function getCurrentSettings() {
    return currentSettings;
  }
  function setCurrentSettings(newSettings) {
    currentSettings = newSettings;
    saveGlobalSettings(currentSettings).catch((error) => {
      console.warn("Failed to save settings", error);
    });
  }
  function loadSettings() {
    loadGlobalSettings().then((loadedSettings) => {
      currentSettings = loadedSettings;
      console.log("Settings loaded successfully");
    }).catch((error) => {
      console.warn("Failed to load settings", error);
    });
  }

  // src/video.ts
  function computeScale(sourceRatio, targetRatio, mode, manualScale = 1) {
    switch (mode) {
      case "showAll":
        if (sourceRatio < targetRatio)
          return [1, sourceRatio / targetRatio];
        else
          return [targetRatio / sourceRatio, 1];
      case "coverAll":
        if (sourceRatio < targetRatio)
          return [targetRatio / sourceRatio, 1];
        else
          return [1, sourceRatio / targetRatio];
      case "manual":
        const r = Math.sqrt(targetRatio / sourceRatio);
        return [manualScale * r, manualScale / r];
    }
  }
  function applyScale(video, scaleX, scaleY) {
    video.style.transform = `scale(${scaleX}, ${scaleY})`;
    console.log(`Applied scale x:${scaleX} y:${scaleY} to `, video);
  }
  function applySettingsToVideo(settings, video) {
    const s = normalizeSettings(settings, detectVideoAspectRatio(video));
    console.log("Normalized settings", s);
    if (!s.enabled) {
      applyScale(video, 1, 1);
    } else {
      const [scaleX, scaleY] = computeScale(s.sourceRatio, s.targetRatio, s.scalingMode, s.manualScale);
      applyScale(video, scaleX, scaleY);
    }
  }
  function detectVideoAspectRatio(video) {
    if (video.videoHeight === 0 || video.videoWidth === 0) {
      console.warn("Video metadata not loaded yet, cannot detect aspect ratio. Defaulting to 16:9.");
      return 16 / 9;
    }
    return video.videoWidth / video.videoHeight;
  }

  // src/mainVideoDetector.ts
  var mainVideo = null;
  function detectMainAspectRatio() {
    if (!mainVideo) {
      console.warn("Cannot detect video aspect ratio because video element is not found. Defaulting to 16:9.");
      return 16 / 9;
    }
    return detectVideoAspectRatio(mainVideo);
  }
  function updateMainVideo() {
    const new_videos = document.querySelectorAll("video");
    let maxArea = 0;
    let new_mainVideo = null;
    for (const video of new_videos) {
      const area = video.videoWidth * video.videoHeight;
      if (area > maxArea) {
        maxArea = area;
        new_mainVideo = video;
      }
    }
    if (new_mainVideo !== mainVideo) {
      mainVideo = new_mainVideo;
      sendDetectedRatioToPopup();
    }
  }

  // src/videoDetector.ts
  var currentVideos = [];
  function handleNewVideo(video) {
    const handler = () => {
      updateMainVideo();
      applySettingsToVideo(getCurrentSettings(), video);
    };
    video.addEventListener("loadedmetadata", handler);
    handler();
    new MutationObserver(handler).observe(video, { attributes: true });
  }
  function handleRemovedVideo(video) {
  }
  function observeDocument() {
    const observer = new MutationObserver(() => {
      for (const video of currentVideos) {
        if (!video.isConnected) {
          handleRemovedVideo(video);
        }
      }
      currentVideos = currentVideos.filter((video) => video.isConnected);
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
  function applySettingsToAllVideos() {
    for (const video of currentVideos) applySettingsToVideo(getCurrentSettings(), video);
  }

  // src/content.ts
  console.log("YouTube Aspect Ratio content script loaded!");
  function sendDetectedRatioToPopup() {
    sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectMainAspectRatio() });
  }
  function sendCurrentSettingsToPopup() {
    sendMessageToPopup({ type: "CURRENT_SETTINGS", settings: getCurrentSettings() });
  }
  function messageHandler(message) {
    console.log("Received message in content script", message);
    switch (message.type) {
      case "REQUEST_DETECTED_RATIO":
        sendDetectedRatioToPopup();
        break;
      case "REQUEST_CURRENT_SETTINGS":
        sendCurrentSettingsToPopup();
        break;
      case "REQUEST_APPLY_SETTINGS":
        applySettingsToAllVideos();
        break;
      case "SETTINGS_UPDATED":
        setCurrentSettings(message.settings);
        applySettingsToAllVideos();
        break;
    }
  }
  chrome.runtime.onMessage.addListener(messageHandler);
  loadSettings();
  observeDocument();
})();
