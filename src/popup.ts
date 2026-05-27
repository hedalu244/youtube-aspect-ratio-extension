console.log("Popup script loaded");

function getRadioValue(name: string): string {
    return (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement).value;
}
function setRadioValue(name: string, value: string) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
        (radio as HTMLInputElement).checked = (radio as HTMLInputElement).value === value;
    });
}

function getElement<T extends HTMLElement>(id: string, constructor: { new(): T; }): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    if (!(element instanceof constructor)) {
        throw new Error(`Element with id "${id}" is not a ${constructor.name}`);
    }
    return element;
}

async function sendMessageToActiveTab(message: Message) {
    saveGlobalSettings(message.settings).catch(error => {
        console.warn("Failed to save settings", error);
    });
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab?.id) {
        console.warn("No active tab found");
        return;
    }

    try {
        await chrome.tabs.sendMessage(activeTab.id, message);
    } catch (error) {
        console.warn("Failed to send message to content script", error);
    }
}

function generateDefaultSetting(): RawSettings {
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

async function loadGlobalSettings(): Promise<RawSettings> {
  const result = await chrome.storage.sync.get("globalSettings");
  return await result.globalSettings || generateDefaultSetting();
}

async function saveGlobalSettings(settings: RawSettings) {
  await chrome.storage.sync.set({
    globalSettings: settings
  });
}

function collectSettings(): RawSettings {
    return {
        enabled: (getElement("enabled", HTMLInputElement)).checked,

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

function applySettingsToUI(settings: RawSettings) {
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

function onUpdate() {
    const settings = collectSettings();
    saveGlobalSettings(settings).catch(error => {
        console.warn("Failed to save settings", error);
    });
    sendMessageToActiveTab({ type: "SETTINGS_UPDATED", settings });
}

window.addEventListener("DOMContentLoaded", async () => {
    await loadGlobalSettings().then(settings => {
        applySettingsToUI(settings);
    }).catch(error => {
        console.warn("Failed to load settings", error);
    });;

    getElement("enabled", HTMLInputElement).addEventListener("change", onUpdate);

    const sourceRatioRadios = document.querySelectorAll('input[name="sourceRatio"]');
    sourceRatioRadios.forEach(radio => radio.addEventListener("change", onUpdate));

    const sourceCustomX = getElement("sourceCustomX", HTMLInputElement);
    const sourceCustomY = getElement("sourceCustomY", HTMLInputElement);
    sourceCustomX.addEventListener("input", onUpdate);
    sourceCustomY.addEventListener("input", onUpdate);

    const targetRatioRadios = document.querySelectorAll('input[name="targetRatio"]');
    targetRatioRadios.forEach(radio => radio.addEventListener("change", onUpdate));

    const targetCustomX = getElement("targetCustomX", HTMLInputElement);
    const targetCustomY = getElement("targetCustomY", HTMLInputElement);
    targetCustomX.addEventListener("input", onUpdate);
    targetCustomY.addEventListener("input", onUpdate);

    const scalingModeRadios = document.querySelectorAll('input[name="scalingMode"]');
    scalingModeRadios.forEach(radio => radio.addEventListener("change", onUpdate));
    const manualScale = getElement("manualScale", HTMLInputElement);
    manualScale.addEventListener("input", onUpdate);

    //getElement("rememberPerVideo", HTMLInputElement).addEventListener("change", sendSettings);
});


