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

export function showOriginalRatio() {
    switch (getRadioValue("sourceRatio")) {
        case "auto": 
            const detectedRatio = getElement("detectedRatio", HTMLSpanElement).textContent;
            getElement("originalRatio", HTMLSpanElement).textContent = detectedRatio;
            return;
        case "custom":
            const customX = getElement("sourceCustomX", HTMLInputElement).value;
            const customY = getElement("sourceCustomY", HTMLInputElement).value;
            getElement("originalRatio", HTMLSpanElement).textContent = `${customX}:${customY}`;
            return;
        default:
            getElement("originalRatio", HTMLSpanElement).textContent = getRadioValue("sourceRatio");
            return;
    }
}

export function showDetectedRatio(ratio: number) {
    getElement("detectedRatio", HTMLSpanElement).textContent = ratioToString(ratio);
    showOriginalRatio();
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
        }
    };
}

export function applySettingsToGUI(settings: RawSettings) {
    setRadioValue("sourceRatio", settings.sourceRatio.mode);
    setRadioValue("targetRatio", settings.targetRatio.mode);
    setRadioValue("scalingMode", settings.scalingMode.mode);
    getElement("enabled", HTMLInputElement).checked = settings.enabled;
    getElement("sourceCustomX", HTMLInputElement).value = settings.sourceRatio.customX;
    getElement("sourceCustomY", HTMLInputElement).value = settings.sourceRatio.customY;
    getElement("targetCustomX", HTMLInputElement).value = settings.targetRatio.customX;
    getElement("targetCustomY", HTMLInputElement).value = settings.targetRatio.customY;
    getElement("manualScale", HTMLInputElement).value = settings.scalingMode.manualScale;
    showOriginalRatio();
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

    //getElement("rememberPerVideo", HTMLInputElement).addEventListener("change", sendSettings);
}