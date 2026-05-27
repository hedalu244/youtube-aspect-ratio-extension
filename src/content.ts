console.log("YouTube Aspect Ratio content script loaded");

window.addEventListener("load", () => {
    console.log("Window loaded");
});

chrome.runtime.onMessage.addListener((message: Message) => {
    console.log("Received message in content script", message);
});
