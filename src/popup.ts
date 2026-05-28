import { MessageToPopup, sendMessageToActiveTab, sendMessageToAllTabs } from "./message";
import { getSettingsFromGUI, showDetectedRatio, setUpdateListenerToGUI, setupGUI, showSettings } from "./gui";
import { forgetSettings, loadCurrentSettings, rememberSettings, saveGlobalSettings } from "./settingManager";
declare const chrome: any;

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

async function messageHandler(message: MessageToPopup) {
    console.log("Received message in popup script", message);

    switch (message.type) {
        case "DETECTED_RATIO":
            showDetectedRatio(message.ratio);
            return;
        case "CURRENT_SETTINGS":
            // CURRENT_SETTINGSは、popupが開かれたときにcontent scriptから送られてくる。
            // この応答が来るまではGUIは操作できない。
            setupGUI();

            showSettings(message.settings);

            setUpdateListenerToGUI(guiUpdateListener);

            sendMessageToActiveTab({ type: "REQUEST_DETECTED_RATIO" });
            break;
    }
}

chrome.runtime.onMessage.addListener(messageHandler);

sendMessageToActiveTab({ type: "REQUEST_CURRENT_SETTINGS" });
