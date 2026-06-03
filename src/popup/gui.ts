import { getElementById, getRadioValue, setRadioValue, setChangeListenerToRadioGroup } from "./dom";
import { RawSettings } from "../common/settingData";
import { ratioToString } from "../common/ratio";

// enabledのチェック状態と設定UIの表示非表示を一致させる。
function updateHideStatus() {
    const hideWhenDisabled = getElementById("hideWhenDisabled", HTMLDivElement);
    if (getElementById("enabled", HTMLInputElement).checked) {
        hideWhenDisabled.style.display = "block";
    } else {
        hideWhenDisabled.style.display = "none";
    }
}

function unlockGUI() {
    if (getElementById("enabled", HTMLInputElement).disabled) {
        getElementById("enabled", HTMLInputElement).disabled = false;
        updateHideStatus();
    }
}

function lockGUI() {
    if (!getElementById("enabled", HTMLInputElement).disabled) {
        getElementById("enabled", HTMLInputElement).checked = false;
        getElementById("enabled", HTMLInputElement).disabled = true;
        updateHideStatus();
    }
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

// GUIに設定を表示する。nullが渡されたときはGUIを操作できないようにする。
export function setSettingsToGUI(settings: RawSettings | null) {
    if (!settings) { lockGUI(); return; }

    unlockGUI();

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
export function setEventListenerToGUI(updateListener: () => void) {
    setChangeListenerToRadioGroup("sourceRatio", updateListener);
    setChangeListenerToRadioGroup("targetRatio", updateListener);
    setChangeListenerToRadioGroup("scalingMode", updateListener);
    getElementById("enabled", HTMLInputElement).addEventListener("change", updateListener);
    getElementById("sourceCustomX", HTMLInputElement).addEventListener("input", updateListener);
    getElementById("sourceCustomY", HTMLInputElement).addEventListener("input", updateListener);
    getElementById("targetCustomX", HTMLInputElement).addEventListener("input", updateListener);
    getElementById("targetCustomY", HTMLInputElement).addEventListener("input", updateListener);
    getElementById("manualScale", HTMLInputElement).addEventListener("input", updateListener);
    getElementById("remember", HTMLInputElement).addEventListener("input", updateListener);

    getElementById("enabled", HTMLInputElement).addEventListener("change", updateHideStatus);
}

// アスペクト比をGUIに表示する。
export function showDetectedRatio(ratio: number) {
    getElementById("detectedRatio", HTMLSpanElement).textContent = ratioToString(ratio);
}