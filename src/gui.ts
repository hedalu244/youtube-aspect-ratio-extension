import { RawSettings } from "./settingData";
import { ratioToString } from "./ratio";

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

function getRadioValue(name: string): string {
    return (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement).value;
}

function setRadioValue(name: string, value: string) {
    document.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
        (radio as HTMLInputElement).checked = (radio as HTMLInputElement).value === value;
    });
}

function setChangeListenerToRadioGroup(name: string, handler: () => void) {
    const radios = document.querySelectorAll(`input[name="${name}"]`);
    radios.forEach(radio => radio.addEventListener("change", handler));
}

export function showDetectedRatio(ratio: number) {
    getElement("detectedRatio", HTMLSpanElement).textContent = ratioToString(ratio);
}

export function getSettingsFromGUI(): RawSettings {
    return {
        enabled: getElement("enabled", HTMLInputElement).checked,

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
        },

        remember: getElement("remember", HTMLInputElement).checked
    };
}

function updateHideStatus() {
    const hideWhenDisabled = getElement("hideWhenDisabled", HTMLDivElement);
    if (getElement("enabled", HTMLInputElement).checked) {
        hideWhenDisabled.style.display = "block";
    } else {
        hideWhenDisabled.style.display = "none";
    }
}

export function setupGUI() {
    getElement("enabled", HTMLInputElement).disabled = false;
    getElement("enabled", HTMLInputElement).addEventListener("change", updateHideStatus);
    updateHideStatus();
}

export function showSettings(settings: RawSettings) {
    setRadioValue("sourceRatio", settings.sourceRatio.mode);
    setRadioValue("targetRatio", settings.targetRatio.mode);
    setRadioValue("scalingMode", settings.scalingMode.mode);
    getElement("enabled", HTMLInputElement).checked = settings.enabled;
    getElement("sourceCustomX", HTMLInputElement).value = settings.sourceRatio.customX;
    getElement("sourceCustomY", HTMLInputElement).value = settings.sourceRatio.customY;
    getElement("targetCustomX", HTMLInputElement).value = settings.targetRatio.customX;
    getElement("targetCustomY", HTMLInputElement).value = settings.targetRatio.customY;
    getElement("manualScale", HTMLInputElement).value = settings.scalingMode.manualScale;
    getElement("remember", HTMLInputElement).checked = settings.remember;

    updateHideStatus();
}

export function setUpdateListenerToGUI(listener: () => void) {
    setChangeListenerToRadioGroup("sourceRatio", listener);
    setChangeListenerToRadioGroup("targetRatio", listener);
    setChangeListenerToRadioGroup("scalingMode", listener);
    getElement("enabled", HTMLInputElement).addEventListener("change", listener);
    getElement("sourceCustomX", HTMLInputElement).addEventListener("input", listener);
    getElement("sourceCustomY", HTMLInputElement).addEventListener("input", listener);
    getElement("targetCustomX", HTMLInputElement).addEventListener("input", listener);
    getElement("targetCustomY", HTMLInputElement).addEventListener("input", listener);
    getElement("manualScale", HTMLInputElement).addEventListener("input", listener);
    getElement("remember", HTMLInputElement).addEventListener("input", listener);
}