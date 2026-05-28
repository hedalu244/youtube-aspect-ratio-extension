import { MessageCtoP, sendMessageToActiveTab } from "./message";
import { getSettingsFromGUI, applySettingsToGUI, showDetectedRatio, setUpdateListenerToGUI } from "./gui";
declare const chrome: any;

console.log("Popup script loaded");

function messageHandler(message: MessageCtoP) {
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

setUpdateListenerToGUI(() => sendMessageToActiveTab({ type: "SETTINGS_UPDATED", settings : getSettingsFromGUI()}));