document.getElementById("close-popup").addEventListener("click", () => {
  window.close();
});

const selectionTextArea = document.getElementById("selection-text");
const markSelectedButton = document.getElementById("mark-selected");
const saveButton = document.getElementById("save");
const rememUrlInput = document.getElementById("remem-url");
const directoryInput = document.getElementById("directory");
const saveError = document.getElementById("save-error");

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

saveButton.addEventListener("click", async () => {
  saveError.textContent = "";
  const baseUrl = rememUrlInput.value.trim();
  const url = `${baseUrl.replace(/\/$/, "")}/save_fill_gaps_card`;
  const payload = {
    dir: directoryInput.value,
    text: selectionTextArea.value,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      window.close();
      return;
    }

    const errorText = await response.text();
    saveError.textContent = errorText || "Request failed.";
  } catch (error) {
    saveError.textContent = error.message || "Request failed.";
  }
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
  const newCaret = rangeStart + markedText.length;
  selectionTextArea.setSelectionRange(newCaret, newCaret);
  selectionTextArea.focus();
});
