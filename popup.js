(() => {
  // src/message.ts
  async function sendMessageToActiveTab(message) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!activeTab?.id) {
      console.warn("No active tab found", message);
      return;
    }
    try {
      await chrome.tabs.sendMessage(activeTab.id, message);
    } catch (error) {
      console.warn("Failed to send message to content script", message, error);
    }
  }
  async function sendMessageToAllTabs(message) {
    const tabs = await chrome.tabs.query({ url: ["https://www.youtube.com/*"] });
    for (const tab of tabs) {
      if (!tab.id) {
        continue;
      }
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch (error) {
        console.warn("Failed to send message to content script", { tabId: tab.id, message, error });
      }
    }
  }

  // src/ratio.ts
  function ratioToString(ratio) {
    let best = { x: ratio, y: 1, score: Infinity };
    for (let i = 1; i <= 30; i++) {
      const a = Math.round(i * ratio * 100) / 100;
      const b = Math.round(i / ratio * 100) / 100;
      const score_a = Math.abs(a - Math.round(a));
      const score_b = Math.abs(b - Math.round(b));
      if (score_a < best.score) best = { x: a, y: i, score: score_a };
      if (score_b < best.score) best = { x: i, y: b, score: score_b };
      if (best.score < 5e-3) break;
    }
    return `${best.x}:${best.y}`;
  }

  // src/gui.ts
  function getElementById(id, constructor) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id "${id}" not found`);
    }
    if (!(element instanceof constructor)) {
      throw new Error(`${element} is not a ${constructor.name}`);
    }
    return element;
  }
  function getElementsByName(name, constructor) {
    const nodeList = document.getElementsByName(name);
    const elements = [];
    if (nodeList.length === 0) {
      throw new Error(`Element with name "${name}" not found`);
    }
    for (const element of nodeList) {
      if (!(element instanceof constructor)) {
        throw new Error(`${element} is not a ${constructor.name}`);
      }
      elements.push(element);
    }
    return elements;
  }
  function getRadioValue(name) {
    const radios = getElementsByName(name, HTMLInputElement);
    for (const radio of radios) {
      if (radio.checked) return radio.value;
    }
    throw new Error(`No radio button with name "${name}" is checked`);
  }
  function setRadioValue(name, value) {
    getElementsByName(name, HTMLInputElement).forEach((radio) => {
      radio.checked = radio.value === value;
    });
  }
  function setChangeListenerToRadioGroup(name, handler) {
    getElementsByName(name, HTMLInputElement).forEach((radio) => radio.addEventListener("change", handler));
  }
  function updateHideStatus() {
    const hideWhenDisabled = getElementById("hideWhenDisabled", HTMLDivElement);
    if (getElementById("enabled", HTMLInputElement).checked) {
      hideWhenDisabled.style.display = "block";
    } else {
      hideWhenDisabled.style.display = "none";
    }
  }
  function setupGUI() {
    getElementById("enabled", HTMLInputElement).disabled = false;
    updateHideStatus();
    getElementById("enabled", HTMLInputElement).addEventListener("change", updateHideStatus);
  }
  function getSettingsFromGUI() {
    return {
      enabled: getElementById("enabled", HTMLInputElement).checked,
      sourceRatio: {
        mode: getRadioValue("sourceRatio"),
        customX: getElementById("sourceCustomX", HTMLInputElement).value,
        customY: getElementById("sourceCustomY", HTMLInputElement).value
      },
      targetRatio: {
        mode: getRadioValue("targetRatio"),
        customX: getElementById("targetCustomX", HTMLInputElement).value,
        customY: getElementById("targetCustomY", HTMLInputElement).value
      },
      scalingMode: {
        mode: getRadioValue("scalingMode"),
        manualScale: getElementById("manualScale", HTMLInputElement).value
      },
      remember: getElementById("remember", HTMLInputElement).checked
    };
  }
  function showSettings(settings) {
    setRadioValue("sourceRatio", settings.sourceRatio.mode);
    setRadioValue("targetRatio", settings.targetRatio.mode);
    setRadioValue("scalingMode", settings.scalingMode.mode);
    getElementById("enabled", HTMLInputElement).checked = settings.enabled;
    getElementById("sourceCustomX", HTMLInputElement).value = settings.sourceRatio.customX;
    getElementById("sourceCustomY", HTMLInputElement).value = settings.sourceRatio.customY;
    getElementById("targetCustomX", HTMLInputElement).value = settings.targetRatio.customX;
    getElementById("targetCustomY", HTMLInputElement).value = settings.targetRatio.customY;
    getElementById("manualScale", HTMLInputElement).value = settings.scalingMode.manualScale;
    getElementById("remember", HTMLInputElement).checked = settings.remember;
    updateHideStatus();
  }
  function setUpdateListenerToGUI(listener) {
    setChangeListenerToRadioGroup("sourceRatio", listener);
    setChangeListenerToRadioGroup("targetRatio", listener);
    setChangeListenerToRadioGroup("scalingMode", listener);
    getElementById("enabled", HTMLInputElement).addEventListener("change", listener);
    getElementById("sourceCustomX", HTMLInputElement).addEventListener("input", listener);
    getElementById("sourceCustomY", HTMLInputElement).addEventListener("input", listener);
    getElementById("targetCustomX", HTMLInputElement).addEventListener("input", listener);
    getElementById("targetCustomY", HTMLInputElement).addEventListener("input", listener);
    getElementById("manualScale", HTMLInputElement).addEventListener("input", listener);
    getElementById("remember", HTMLInputElement).addEventListener("input", listener);
  }
  function showDetectedRatio(ratio) {
    getElementById("detectedRatio", HTMLSpanElement).textContent = ratioToString(ratio);
  }

  // src/settingManager.ts
  async function saveGlobalSettings(settings) {
    await chrome.storage.sync.set({ globalSettings: settings });
  }

  // src/popup.ts
  console.log("Popup script loaded");
  async function guiUpdateListener() {
    const settings = getSettingsFromGUI();
    if (settings.remember) {
      await sendMessageToActiveTab({ type: "REQUEST_REMEMBER_SETTINGS", settings });
    } else {
      await sendMessageToActiveTab({ type: "REQUEST_FORGET_SETTINGS" });
      await saveGlobalSettings(settings);
    }
    await sendMessageToAllTabs({ type: "SETTINGS_UPDATED" });
  }
  async function messageHandler(message) {
    console.log("Received message in popup script", message);
    switch (message.type) {
      case "DETECTED_RATIO":
        showDetectedRatio(message.ratio);
        return;
      case "CURRENT_SETTINGS":
        setupGUI();
        showSettings(message.settings);
        setUpdateListenerToGUI(guiUpdateListener);
        sendMessageToActiveTab({ type: "REQUEST_DETECTED_RATIO" });
        break;
    }
  }
  chrome.runtime.onMessage.addListener(messageHandler);
  sendMessageToActiveTab({ type: "REQUEST_CURRENT_SETTINGS" });
})();
