import { MessageToPopup, sendMessageToActiveTab, sendMessageToAllTabs } from "./message";
import { getSettingsFromGUI, showDetectedRatio, setUpdateListenerToGUI, setupGUI, showSettings } from "./gui";
import { saveSettings } from "./settingManager";
declare const chrome: any;

console.log("Popup script loaded");

function messageHandler(message: MessageToPopup) {
    console.log("Received message in popup script", message);

    switch (message.type) {
        case "DETECTED_RATIO":
            showDetectedRatio(message.ratio);
            break;
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

sendMessageToActiveTab({ type: "REQUEST_DETECTED_RATIO" });

setupGUI();

showSettings();

setUpdateListenerToGUI(async () => {
    try {
        await saveSettings(getSettingsFromGUI());
        await sendMessageToAllTabs({ type: "SETTINGS_UPDATED" });
    } catch (error) {
        console.warn("Failed to save settings", error);
    }
});
