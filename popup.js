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
  if (start == null || end == null) {
    return;
  }
  const value = selectionTextArea.value;
  let rangeStart = start;
  let rangeEnd = end;

  if (start === end) {
    const isWhitespace = (ch) => /\s/.test(ch);
    let left = start;
    let right = start;

    while (left > 0 && !isWhitespace(value[left - 1])) {
      left -= 1;
    }
    while (right < value.length && !isWhitespace(value[right])) {
      right += 1;
    }
    if (left === right) {
      return;
    }
    rangeStart = left;
    rangeEnd = right;
  }

  const selectedText = value.slice(rangeStart, rangeEnd);
  const markedText = `[[${selectedText}]]`;
  selectionTextArea.value =
    value.slice(0, rangeStart) + markedText + value.slice(rangeEnd);
  const newEnd = rangeStart + markedText.length;
  selectionTextArea.setSelectionRange(rangeStart, newEnd);
  selectionTextArea.focus();
});
