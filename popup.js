document.getElementById("close-popup").addEventListener("click", () => {
  window.close();
});

const selectionTextArea = document.getElementById("selection-text");
const markSelectedButton = document.getElementById("mark-selected");

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

markSelectedButton.addEventListener("click", () => {
  const start = selectionTextArea.selectionStart;
  const end = selectionTextArea.selectionEnd;
  if (start == null || end == null || start === end) {
    return;
  }
  const value = selectionTextArea.value;
  const selectedText = value.slice(start, end);
  const markedText = `[[${selectedText}]]`;
  selectionTextArea.value =
    value.slice(0, start) + markedText + value.slice(end);
  const newEnd = start + markedText.length;
  selectionTextArea.setSelectionRange(start, newEnd);
  selectionTextArea.focus();
});
