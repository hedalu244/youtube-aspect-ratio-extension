import { MessageToPopup, sendMessageToActiveTab, sendMessageToAllTabs } from "./message";
import { getSettingsFromGUI, showDetectedRatio, setUpdateListenerToGUI, setupGUI, showSettings } from "./gui";
import { forgetSettings, loadSettings, rememberSettings, saveSettings } from "./settingManager";
declare const chrome: any;

console.log("Popup script loaded");

async function messageHandler(message: MessageToPopup) {
    console.log("Received message in popup script", message);

    switch (message.type) {
        case "DETECTED_RATIO":
            showDetectedRatio(message.ratio);
            return;
        case "CURRENT_SETTINGS":
            setupGUI();

            showSettings(message.settings);

            setUpdateListenerToGUI(async () => {
                const settings = getSettingsFromGUI();

                if (settings.remember) {
                    await sendMessageToActiveTab({ type: "REQUEST_REMEMBER_SETTINGS", settings });
                } else {
                    await sendMessageToActiveTab({ type: "REQUEST_FORGET_SETTINGS" });
                    await saveSettings(settings);
                }
                await sendMessageToAllTabs({ type: "SETTINGS_UPDATED" });
            });

            sendMessageToActiveTab({ type: "REQUEST_DETECTED_RATIO" });
            break;
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

sendMessageToActiveTab({ type: "REQUEST_CURRENT_SETTINGS" });
