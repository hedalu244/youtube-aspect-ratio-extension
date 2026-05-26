console.log("YouTube Aspect Ratio content script loaded");

window.addEventListener("load", () => {
    console.log("Window loaded");
});

chrome.runtime.onMessage.addListener((message: Message) => {
    if (message?.type === "APPLY_ASPECT_RATIO") {
        console.log("Apply clicked");
    }
});
