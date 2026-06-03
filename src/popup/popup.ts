import { getActiveTabURL, isYouTubeURL } from "../tabs";
import { MessageToPopup, sendMessageToActiveTab, sendMessageToAllTabs } from "../message";
import { getSettingsFromGUI, showDetectedRatio, setEventListenerToGUI, setSettingsToGUI } from "./gui";
import { loadCurrentSettings, saveCurrentSettings } from "../storage";
declare const chrome: any;

console.log("Popup script loaded");

async function guiUpdateListener() {
    const url = await getActiveTabURL();
    const settings = getSettingsFromGUI();
    await saveCurrentSettings(url, settings);
    await sendMessageToAllTabs({ type: "SETTINGS_UPDATED" });
}

async function messageHandler(message: MessageToPopup) {
    console.log("Received message in popup script", message);

    switch (message.type) {
        case "DETECTED_RATIO":
            showDetectedRatio(message.ratio);
            return;
    }
}

async function urlChanged() {
    const url = await getActiveTabURL();

    if (!url || !isYouTubeURL(url)) { setSettingsToGUI(null); return; }

    const settings = await loadCurrentSettings(url);
    setSettingsToGUI(settings);
    sendMessageToActiveTab({ type: "REQUEST_DETECTED_RATIO" });
}

setEventListenerToGUI(guiUpdateListener);
chrome.runtime.onMessage.addListener(messageHandler);
urlChanged();