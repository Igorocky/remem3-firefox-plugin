document.getElementById("close-popup").addEventListener("click", () => {
  window.close();
});

const selectionTextArea = document.getElementById("selection-text");
const markSelectedButton = document.getElementById("mark-selected");
const rememUrlInput = document.getElementById("remem-url");
const directoryInput = document.getElementById("directory");

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

const STORAGE_KEYS = {
  rememUrl: "rememUrl",
  directory: "directory",
};

browser.storage.local
  .get([STORAGE_KEYS.rememUrl, STORAGE_KEYS.directory])
  .then((result) => {
    rememUrlInput.value = result[STORAGE_KEYS.rememUrl] || "";
    directoryInput.value = result[STORAGE_KEYS.directory] || "";
  })
  .catch(() => {
    rememUrlInput.value = "";
    directoryInput.value = "";
  });

const persistFields = () => {
  browser.storage.local.set({
    [STORAGE_KEYS.rememUrl]: rememUrlInput.value,
    [STORAGE_KEYS.directory]: directoryInput.value,
  });
};

rememUrlInput.addEventListener("input", persistFields);
directoryInput.addEventListener("input", persistFields);

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
  const newCaret = rangeStart + markedText.length;
  selectionTextArea.setSelectionRange(newCaret, newCaret);
  selectionTextArea.focus();
});
