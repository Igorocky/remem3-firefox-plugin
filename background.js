const POPUP_URL = browser.runtime.getURL("popup.html");

browser.action.onClicked.addListener(async () => {
  await browser.windows.create({
    url: POPUP_URL,
    type: "popup",
    width: 360,
    height: 240,
  });
});
