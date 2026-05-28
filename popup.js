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
    setRadioValue("sourceRatio", settings.sourceRatio.mode);
    setRadioValue("targetRatio", settings.targetRatio.mode);
    setRadioValue("scalingMode", settings.scalingMode.mode);
    getElement("enabled", HTMLInputElement).checked = settings.enabled;
    getElement("sourceCustomX", HTMLInputElement).value = settings.sourceRatio.customX;
    getElement("sourceCustomY", HTMLInputElement).value = settings.sourceRatio.customY;
    getElement("targetCustomX", HTMLInputElement).value = settings.targetRatio.customX;
    getElement("targetCustomY", HTMLInputElement).value = settings.targetRatio.customY;
    getElement("manualScale", HTMLInputElement).value = settings.scalingMode.manualScale;
  }
  function setUpdateListenerToGUI(listener) {
    setChangeListenerToRadioGroup("sourceRatio", listener);
    setChangeListenerToRadioGroup("targetRatio", listener);
    setChangeListenerToRadioGroup("scalingMode", listener);
    getElement("enabled", HTMLInputElement).addEventListener("change", listener);
    getElement("sourceCustomX", HTMLInputElement).addEventListener("input", listener);
    getElement("sourceCustomY", HTMLInputElement).addEventListener("input", listener);
    getElement("targetCustomX", HTMLInputElement).addEventListener("input", listener);
    getElement("targetCustomY", HTMLInputElement).addEventListener("input", listener);
    getElement("manualScale", HTMLInputElement).addEventListener("input", listener);
  }
  function showDetectedRatio(ratio) {
    getElement("detectedRatio", HTMLSpanElement).textContent = ratioToString(ratio);
  }

  // src/popup.ts
  console.log("Popup script loaded");
  function messageHandler(message) {
    console.log("Received message in popup script", message);
    if (message.type === "DETECTED_RATIO") {
      try {
        showDetectedRatio(message.ratio);
      } catch (error) {
        console.warn("Failed to update detected ratio in popup", error);
      }
    }
    if (message.type === "CURRENT_SETTINGS") {
      try {
        applySettingsToGUI(message.settings);
      } catch (error) {
        console.warn("Failed to apply current settings to popup", error);
      }
    }
  }
  chrome.runtime.onMessage.addListener(messageHandler);
  sendMessageToActiveTab({ type: "REQUEST_CURRENT_SETTINGS" });
  sendMessageToActiveTab({ type: "REQUEST_DETECTED_RATIO" });
  setUpdateListenerToGUI(() => sendMessageToActiveTab({ type: "SETTINGS_UPDATED", settings: getSettingsFromGUI() }));
})();
