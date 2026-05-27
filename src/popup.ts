import { Message, sendMessageToActiveTab } from "./message";
import { saveGlobalSettings, loadGlobalSettings } from "./storage";
import { getSettingsFromGUI, applySettingsToGUI, showDetectedRatio, setUpdateListenerToGUI } from "./gui";

console.log("Popup script loaded");

function messageHandler(message: Message) {
    console.log("Received message in popup script", message);
    
    if (message.type === "DETECTED_RATIO_UPDATED") {
        showDetectedRatio(message.ratio);
    }
}

function updateHandler() {
    const settings = getSettingsFromGUI();

    saveGlobalSettings(settings).catch(error => {
        console.warn("Failed to save settings", error);
    });

    sendMessageToActiveTab({ type: "SETTINGS_UPDATED", settings });
}

//chrome.runtime.onMessage.addListener(messageHandler);

loadGlobalSettings().then(loadedSettings => {
    applySettingsToGUI(loadedSettings);
}).catch(error => {
    console.warn("Failed to load settings", error);
});

sendMessageToActiveTab({ type: "REQUEST_DETECTED_RATIO" });

setUpdateListenerToGUI(updateHandler);