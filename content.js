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
      },
      remember: false
      // 重要。これがtrueだとすべての動画の設定が保存されてしまい、ストレージに悪影響そう
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
  async function loadGlobalSettings() {
    const result = await chrome.storage.sync.get("globalSettings");
    const globalSettings = result.globalSettings || generateDefaultSetting();
    return { ...globalSettings, remember: false };
  }
  async function loadURLSettings(url) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = (result.urlSettings || {})[url] || null;
    if (!urlSettings) return null;
    return { ...urlSettings, remember: true };
  }
  async function rememberSettings(url, settings) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = result.urlSettings || {};
    urlSettings[url] = settings;
    await chrome.storage.sync.set({ urlSettings });
  }
  async function forgetSettings(url) {
    const result = await chrome.storage.sync.get("urlSettings");
    const urlSettings = result.urlSettings || {};
    delete urlSettings[url];
    await chrome.storage.sync.set({ urlSettings });
  }
  async function loadCurrentSettings(url) {
    try {
      const urlSettings = await loadURLSettings(url);
      if (urlSettings) {
        return urlSettings;
      }
      const globalSettings = await loadGlobalSettings();
      return globalSettings;
    } catch (error) {
      console.warn("Failed to load settings", error);
      return generateDefaultSetting();
    }
  }

  // src/video.ts
  function detectVideoAspectRatio(video) {
    if (video.videoHeight === 0 || video.videoWidth === 0) {
      return 16 / 9;
    }
    return video.videoWidth / video.videoHeight;
  }
  function detectWrapperAspectRatio(video) {
    const wrapper = video.closest("#movie_player");
    if (!wrapper) {
      return detectVideoAspectRatio(video);
    }
    const width = wrapper.clientWidth;
    const height = wrapper.clientHeight;
    return width / height;
  }
  function computeScale(sourceRatio, targetRatio, wrapperRatio, mode, manualScale = 1) {
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
  function applyScale(video, scaleX, scaleY) {
    video.style.transform = `scale(${scaleX}, ${scaleY})`;
    console.log(`Applied scale x:${scaleX} y:${scaleY}`);
  }
  function applySettingsToVideo(rawSettings, video) {
    const settings = normalizeSettings(rawSettings, detectVideoAspectRatio(video));
    if (!settings.enabled) {
      applyScale(video, 1, 1);
    } else {
      const wrapperRatio = detectWrapperAspectRatio(video);
      const [scaleX, scaleY] = computeScale(settings.sourceRatio, settings.targetRatio, wrapperRatio, settings.scalingMode, settings.manualScale);
      applyScale(video, scaleX, scaleY);
    }
  }

  // src/mainVideoDetector.ts
  var mainVideo = null;
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
  function detectMainAspectRatio() {
    if (!mainVideo) {
      console.warn("Cannot detect video aspect ratio because video element is not found. Defaulting to 16:9.");
      return 16 / 9;
    }
    return detectVideoAspectRatio(mainVideo);
  }

  // src/videoDetector.ts
  var currentVideos = [];
  function handleNewVideo(video) {
    const handler = async () => {
      updateMainVideo();
      applySettingsToVideo(await loadCurrentSettings(window.location.href), video);
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
  async function applySettingsToAllVideos() {
    for (const video of currentVideos)
      applySettingsToVideo(await loadCurrentSettings(window.location.href), video);
  }

  // src/content.ts
  console.log("YouTube Aspect Ratio content script loaded!");
  function sendDetectedRatioToPopup() {
    sendMessageToPopup({ type: "DETECTED_RATIO", ratio: detectMainAspectRatio() });
  }
  async function messageHandler(message) {
    console.log("Received message in content script", message);
    switch (message.type) {
      case "REQUEST_DETECTED_RATIO":
        sendDetectedRatioToPopup();
        break;
      case "SETTINGS_UPDATED":
        applySettingsToAllVideos();
        break;
      case "REQUEST_REMEMBER_SETTINGS":
        rememberSettings(window.location.href, message.settings);
        break;
      case "REQUEST_FORGET_SETTINGS":
        forgetSettings(window.location.href);
        break;
      case "REQUEST_CURRENT_SETTINGS":
        const settings = await loadCurrentSettings(window.location.href);
        sendMessageToPopup({ type: "CURRENT_SETTINGS", settings });
    }
  }
  chrome.runtime.onMessage.addListener(messageHandler);
  observeDocument();
})();
