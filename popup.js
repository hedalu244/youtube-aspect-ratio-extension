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

  // src/dom.ts
  function getElement(id, constructor) {
    const element = document.getElementById(id);
    if (!element) {
      throw new Error(`Element with id "${id}" not found`);
    }
    if (!(element instanceof constructor)) {
      throw new Error(`Element with id "${id}" is not a ${constructor.name}`);
    }
    return element;
  }
  function getRadioValue(name) {
    return document.querySelector(`input[name="${name}"]:checked`).value;
  }
  function setRadioValue(name, value) {
    document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
      radio.checked = radio.value === value;
    });
  }

  // src/gui.ts
  function setChangeListenerToRadioGroup(name, handler) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach((radio) => radio.addEventListener("change", handler));
  }
  function getSettingsFromGUI() {
    return {
      enabled: getElement("enabled", HTMLInputElement).checked,
      sourceRatio: {
        mode: getRadioValue("sourceRatio"),
        customX: getElement("sourceCustomX", HTMLInputElement).value,
        customY: getElement("sourceCustomY", HTMLInputElement).value
      },
      targetRatio: {
        mode: getRadioValue("targetRatio"),
        customX: getElement("targetCustomX", HTMLInputElement).value,
        customY: getElement("targetCustomY", HTMLInputElement).value
      },
      scalingMode: {
        mode: getRadioValue("scalingMode"),
        manualScale: getElement("manualScale", HTMLInputElement).value
      }
    };
  }
  function applySettingsToGUI(settings) {
    getElement("enabled", HTMLInputElement).checked = settings.enabled;
    setRadioValue("sourceRatio", settings.sourceRatio.mode);
    getElement("sourceCustomX", HTMLInputElement).value = settings.sourceRatio.customX;
    getElement("sourceCustomY", HTMLInputElement).value = settings.sourceRatio.customY;
    setRadioValue("targetRatio", settings.targetRatio.mode);
    getElement("targetCustomX", HTMLInputElement).value = settings.targetRatio.customX;
    getElement("targetCustomY", HTMLInputElement).value = settings.targetRatio.customY;
    setRadioValue("scalingMode", settings.scalingMode.mode);
    getElement("manualScale", HTMLInputElement).value = settings.scalingMode.manualScale;
  }
  function setUpdateListenerToGUI(listener) {
    getElement("enabled", HTMLInputElement).addEventListener("change", listener);
    setChangeListenerToRadioGroup("sourceRatio", listener);
    getElement("sourceCustomX", HTMLInputElement).addEventListener("input", listener);
    getElement("sourceCustomY", HTMLInputElement).addEventListener("input", listener);
    setChangeListenerToRadioGroup("targetRatio", listener);
    getElement("targetCustomX", HTMLInputElement).addEventListener("input", listener);
    getElement("targetCustomY", HTMLInputElement).addEventListener("input", listener);
    setChangeListenerToRadioGroup("scalingMode", listener);
    getElement("manualScale", HTMLInputElement).addEventListener("input", listener);
  }

  // src/popup.ts
  console.log("Popup script loaded");
  function updateHandler() {
    const settings = getSettingsFromGUI();
    saveGlobalSettings(settings).catch((error) => {
      console.warn("Failed to save settings", error);
    });
    sendMessageToActiveTab({ type: "SETTINGS_UPDATED", settings });
  }
  loadGlobalSettings().then((loadedSettings) => {
    applySettingsToGUI(loadedSettings);
  }).catch((error) => {
    console.warn("Failed to load settings", error);
  });
  sendMessageToActiveTab({ type: "REQUEST_DETECTED_RATIO" });
  setUpdateListenerToGUI(updateHandler);
})();
