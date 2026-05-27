import { RawSettings } from "./settingData";
import { getElement, getRadioValue, setRadioValue } from "./dom";
import { ratioToString } from "./ratio";

function setChangeListenerToRadioGroup(name: string, handler: () => void) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach(radio => radio.addEventListener("change", handler));
}

export function getSettingsFromGUI(): RawSettings {
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

export function applySettingsToGUI(settings: RawSettings) {
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

export function setUpdateListenerToGUI(listener: () => void) {
    getElement("enabled", HTMLInputElement).addEventListener("change", listener);

    setChangeListenerToRadioGroup("sourceRatio", listener);

    getElement("sourceCustomX", HTMLInputElement).addEventListener("input", listener);
    getElement("sourceCustomY", HTMLInputElement).addEventListener("input", listener);

    setChangeListenerToRadioGroup("targetRatio", listener);

    getElement("targetCustomX", HTMLInputElement).addEventListener("input", listener);
    getElement("targetCustomY", HTMLInputElement).addEventListener("input", listener);

    setChangeListenerToRadioGroup("scalingMode", listener);
    getElement("manualScale", HTMLInputElement).addEventListener("input", listener);

    //getElement("rememberPerVideo", HTMLInputElement).addEventListener("change", sendSettings);
}

export function showDetectedRatio(ratio: number) {
    getElement("detectedRatio", HTMLSpanElement).textContent = ratioToString(ratio);
}