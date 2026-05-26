console.log("Popup script loaded");

window.addEventListener("DOMContentLoaded", () => {
    const applyButton = document.getElementById("applyBtn");

    applyButton?.addEventListener("click", async () => { 
        await sendMessageToActiveTab({ type: "APPLY_ASPECT_RATIO" });
    });
});

async function sendMessageToActiveTab(message: Message) {
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!activeTab?.id) {
        console.warn("No active tab found");
        return;
    }

    try {
        await chrome.tabs.sendMessage(activeTab.id, message);
    } catch (error) {
        console.warn("Failed to send message to content script", error);
    }
}