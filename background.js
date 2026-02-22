const POPUP_URL = browser.runtime.getURL("popup.html");
let lastSelection = "";

browser.browserAction.onClicked.addListener(async () => {
  try {
    const [activeTab] = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (activeTab && activeTab.id != null) {
      const [selection] = await browser.tabs.executeScript(activeTab.id, {
        code: "window.getSelection().toString();",
      });
      lastSelection = selection || "";
    } else {
      lastSelection = "";
    }
  } catch (error) {
    lastSelection = "";
  }
  await browser.windows.create({
    url: POPUP_URL,
    type: "popup",
    width: 360,
    height: 240,
  });
});

browser.runtime.onMessage.addListener((message) => {
  if (message && message.type === "get-selection") {
    return Promise.resolve({ selection: lastSelection });
  }
  return Promise.resolve();
});
