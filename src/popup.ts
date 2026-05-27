console.log("Popup script loaded");

function getRadioValue(name: string): string {
    return (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement).value;
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

function sendSettings() {
    const settings = collectSettings();
    sendMessageToActiveTab({ type: "SETTINGS_UPDATED", settings });
}

window.addEventListener("DOMContentLoaded", () => {
    getElement("enabled", HTMLInputElement).addEventListener("change", sendSettings);

    const sourceRatioRadios = document.querySelectorAll('input[name="sourceRatio"]');
    sourceRatioRadios.forEach(radio => radio.addEventListener("change", sendSettings));

    const sourceCustomX = getElement("sourceCustomX", HTMLInputElement);
    const sourceCustomY = getElement("sourceCustomY", HTMLInputElement);
    sourceCustomX.addEventListener("input", sendSettings);
    sourceCustomY.addEventListener("input", sendSettings);

    const targetRatioRadios = document.querySelectorAll('input[name="targetRatio"]');
    targetRatioRadios.forEach(radio => radio.addEventListener("change", sendSettings));

    const targetCustomX = getElement("targetCustomX", HTMLInputElement);
    const targetCustomY = getElement("targetCustomY", HTMLInputElement);
    targetCustomX.addEventListener("input", sendSettings);
    targetCustomY.addEventListener("input", sendSettings);

    const scalingModeRadios = document.querySelectorAll('input[name="scalingMode"]');
    scalingModeRadios.forEach(radio => radio.addEventListener("change", sendSettings));
    const manualScale = getElement("manualScale", HTMLInputElement);
    manualScale.addEventListener("input", sendSettings);

    getElement("rememberPerVideo", HTMLInputElement).addEventListener("change", sendSettings);
});


async function sendMessageToActiveTab(message: Message) {
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