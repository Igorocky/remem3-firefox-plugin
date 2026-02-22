document.getElementById("close-popup").addEventListener("click", () => {
  window.close();
});

const selectionTextArea = document.getElementById("selection-text");

browser.runtime
  .sendMessage({ type: "get-selection" })
  .then((response) => {
    if (!response) {
      return;
    }
    selectionTextArea.value = response.selection || "";
  })
  .catch(() => {
    selectionTextArea.value = "";
  });
