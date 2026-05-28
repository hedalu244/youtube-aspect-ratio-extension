import { RawSettings } from "../settingData";
import { ratioToString } from "../ratio";

// idから要素を取得する。存在しないときと型が違うときはエラーを投げる。
function getElementById<T extends HTMLElement>(id: string, constructor: { new(): T; }): T {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`Element with id "${id}" not found`);
    }
    if (!(element instanceof constructor)) {
        throw new Error(`${element} is not a ${constructor.name}`);
    }
    return element;
}

// nameから要素を取得する。存在しないときと型が違うときはエラーを投げる。
function getElementsByName<T extends HTMLElement>(name: string, constructor: { new(): T; }): T[] {
    const nodeList = document.getElementsByName(name);
    const elements: T[] = [];
    if (nodeList.length === 0) {
        throw new Error(`Element with name "${name}" not found`);
    }
    for (const element of nodeList) {
        if (!(element instanceof constructor)) {
            throw new Error(`${element} is not a ${constructor.name}`);
        }
        elements.push(element);
    }
    return elements;
}

// ラジオボタンの値を取得する。
function getRadioValue(name: string): string {
    const radios = getElementsByName(name, HTMLInputElement);
    for (const radio of radios) {
        if (radio.checked) return radio.value;
    }
    throw new Error(`No radio button with name "${name}" is checked`);
}

// ラジオボタンの値を設定する。
function setRadioValue(name: string, value: string) {
    getElementsByName(name, HTMLInputElement).forEach(radio => {
        radio.checked = radio.value === value;
    });
}

// ラジオボタンのグループに変更リスナーを設定する。
function setChangeListenerToRadioGroup(name: string, handler: () => void) {
    getElementsByName(name, HTMLInputElement).forEach(radio => radio.addEventListener("change", handler));
}

// enabledのチェック状態と設定UIの表示非表示を一致させる。
function updateHideStatus() {
    const hideWhenDisabled = getElementById("hideWhenDisabled", HTMLDivElement);
    if (getElementById("enabled", HTMLInputElement).checked) {
        hideWhenDisabled.style.display = "block";
    } else {
        hideWhenDisabled.style.display = "none";
    }
}

// GUIのdisabledを解除し、使える状態にする。
export function setupGUI() {
    getElementById("enabled", HTMLInputElement).disabled = false;
    updateHideStatus();
    getElementById("enabled", HTMLInputElement).addEventListener("change", updateHideStatus);
}

// GUIから設定を取得する。
export function getSettingsFromGUI(): RawSettings {
    return {
        enabled: getElementById("enabled", HTMLInputElement).checked,
        sourceRatio: {
            mode: getRadioValue("sourceRatio"),
            customX: getElementById("sourceCustomX", HTMLInputElement).value,
            customY: getElementById("sourceCustomY", HTMLInputElement).value
        },
        targetRatio: {
            mode: getRadioValue("targetRatio"),
            customX: getElementById("targetCustomX", HTMLInputElement).value,
            customY: getElementById("targetCustomY", HTMLInputElement).value
        },
        scalingMode: {
            mode: getRadioValue("scalingMode"),
            manualScale: getElementById("manualScale", HTMLInputElement).value
        },
        remember: getElementById("remember", HTMLInputElement).checked
    };
}

// GUIに設定を表示する。
export function showSettings(settings: RawSettings) {
    setRadioValue("sourceRatio", settings.sourceRatio.mode);
    setRadioValue("targetRatio", settings.targetRatio.mode);
    setRadioValue("scalingMode", settings.scalingMode.mode);
    getElementById("enabled", HTMLInputElement).checked = settings.enabled;
    getElementById("sourceCustomX", HTMLInputElement).value = settings.sourceRatio.customX;
    getElementById("sourceCustomY", HTMLInputElement).value = settings.sourceRatio.customY;
    getElementById("targetCustomX", HTMLInputElement).value = settings.targetRatio.customX;
    getElementById("targetCustomY", HTMLInputElement).value = settings.targetRatio.customY;
    getElementById("manualScale", HTMLInputElement).value = settings.scalingMode.manualScale;
    getElementById("remember", HTMLInputElement).checked = settings.remember;

    updateHideStatus();
}

// GUIの変更を監視するリスナーを登録する。
export function setUpdateListenerToGUI(listener: () => void) {
    setChangeListenerToRadioGroup("sourceRatio", listener);
    setChangeListenerToRadioGroup("targetRatio", listener);
    setChangeListenerToRadioGroup("scalingMode", listener);
    getElementById("enabled", HTMLInputElement).addEventListener("change", listener);
    getElementById("sourceCustomX", HTMLInputElement).addEventListener("input", listener);
    getElementById("sourceCustomY", HTMLInputElement).addEventListener("input", listener);
    getElementById("targetCustomX", HTMLInputElement).addEventListener("input", listener);
    getElementById("targetCustomY", HTMLInputElement).addEventListener("input", listener);
    getElementById("manualScale", HTMLInputElement).addEventListener("input", listener);
    getElementById("remember", HTMLInputElement).addEventListener("input", listener);
}

// アスペクト比をGUIに表示する。
export function showDetectedRatio(ratio: number) {
    getElementById("detectedRatio", HTMLSpanElement).textContent = ratioToString(ratio);
}