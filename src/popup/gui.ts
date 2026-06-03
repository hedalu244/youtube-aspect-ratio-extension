import { getElementById, getRadioValue, setRadioValue, setChangeListenerToRadioGroup } from "./dom";
import { Settings } from "../common/settings";
import { ratioToString } from "../common/ratio";

// このモジュールでは、popupのGUIに設定値を読み書きするための関数を定義する。

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
export function getSettingsFromGUI(): Settings {
    return {
        enabled: getElementById("enabled", HTMLInputElement).checked,
        
        sourceRatioMode: getRadioValue("sourceRatio"),
        sourceRatioCustomX: getElementById("sourceCustomX", HTMLInputElement).value,
        sourceRatioCustomY: getElementById("sourceCustomY", HTMLInputElement).value,

        targetRatioMode: getRadioValue("targetRatio"),
        targetRatioCustomX: getElementById("targetCustomX", HTMLInputElement).value,
        targetRatioCustomY: getElementById("targetCustomY", HTMLInputElement).value,

        scalingMode: getRadioValue("scalingMode"),
        manualScale: getElementById("manualScale", HTMLInputElement).value,
        
        remember: getElementById("remember", HTMLInputElement).checked
    };
}

// GUIに設定を表示する。nullが渡されたときはGUIを操作できないようにする。
export function setSettingsToGUI(settings: Settings | null) {
    if (!settings) { lockGUI(); return; }

    unlockGUI();

    setRadioValue("sourceRatio", settings.sourceRatioMode);
    setRadioValue("targetRatio", settings.targetRatioMode);
    setRadioValue("scalingMode", settings.scalingMode);
    getElementById("enabled", HTMLInputElement).checked = settings.enabled;
    getElementById("sourceCustomX", HTMLInputElement).value = settings.sourceRatioCustomX;
    getElementById("sourceCustomY", HTMLInputElement).value = settings.sourceRatioCustomY;
    getElementById("targetCustomX", HTMLInputElement).value = settings.targetRatioCustomX;
    getElementById("targetCustomY", HTMLInputElement).value = settings.targetRatioCustomY;
    getElementById("manualScale", HTMLInputElement).value = settings.manualScale;
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