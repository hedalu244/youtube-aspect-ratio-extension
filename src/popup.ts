import { MessageToPopup, sendMessageToContent } from "./message";
import { getSettingsFromGUI, applySettingsToGUI, showDetectedRatio, setUpdateListenerToGUI, showOriginalRatio } from "./gui";
declare const chrome: any;

console.log("Popup script loaded");

function messageHandler(message: MessageToPopup) {
    console.log("Received message in popup script", message);

    switch (message.type) {
        case "DETECTED_RATIO":
            showDetectedRatio(message.ratio);
            break;
        case "CURRENT_SETTINGS":
            applySettingsToGUI(message.settings);
            break;
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

sendMessageToContent({ type: "REQUEST_CURRENT_SETTINGS" });

sendMessageToContent({ type: "REQUEST_DETECTED_RATIO" });


setUpdateListenerToGUI(() => showOriginalRatio());

setUpdateListenerToGUI(() => sendMessageToContent({ type: "SETTINGS_UPDATED", settings: getSettingsFromGUI() }));