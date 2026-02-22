document.getElementById("close-popup").addEventListener("click", () => {
  window.close();
});

const selectionTextArea = document.getElementById("selection-text");
const markSelectedButton = document.getElementById("mark-selected");
const saveButton = document.getElementById("save");
const rememUrlInput = document.getElementById("remem-url");
const directoryInput = document.getElementById("directory");
const languagesInput = document.getElementById("languages");
const selectedLanguageSelect = document.getElementById("selected-language");
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
  languages: "languages",
  selectedLanguage: "selectedLanguage",
};

browser.storage.local
  .get([
    STORAGE_KEYS.rememUrl,
    STORAGE_KEYS.directory,
    STORAGE_KEYS.languages,
    STORAGE_KEYS.selectedLanguage,
  ])
  .then((result) => {
    rememUrlInput.value = result[STORAGE_KEYS.rememUrl] || "";
    directoryInput.value = result[STORAGE_KEYS.directory] || "";
    languagesInput.value = result[STORAGE_KEYS.languages] || "";
    const storedSelection = result[STORAGE_KEYS.selectedLanguage] || "";
    updateLanguageOptions(storedSelection);
  })
  .catch(() => {
    rememUrlInput.value = "";
    directoryInput.value = "";
    languagesInput.value = "";
    updateLanguageOptions("");
  });

const persistFields = () => {
  browser.storage.local.set({
    [STORAGE_KEYS.rememUrl]: rememUrlInput.value,
    [STORAGE_KEYS.directory]: directoryInput.value,
    [STORAGE_KEYS.languages]: languagesInput.value,
  });
};

rememUrlInput.addEventListener("input", persistFields);
directoryInput.addEventListener("input", persistFields);
languagesInput.addEventListener("input", () => {
  persistFields();
  const selected = selectedLanguageSelect.value;
  updateLanguageOptions(selected);
});

const parseLanguages = (value) =>
  value
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

const updateLanguageOptions = (selectedValue) => {
  const languages = parseLanguages(languagesInput.value);
  selectedLanguageSelect.innerHTML = "";

  if (languages.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No languages";
    selectedLanguageSelect.appendChild(option);
    selectedLanguageSelect.disabled = true;
    persistSelectedLanguage("");
    return;
  }

  selectedLanguageSelect.disabled = false;
  const normalizedSelection = languages.includes(selectedValue)
    ? selectedValue
    : languages[0];

  languages.forEach((language) => {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = language;
    option.selected = language === normalizedSelection;
    selectedLanguageSelect.appendChild(option);
  });

  if (normalizedSelection !== selectedValue) {
    persistSelectedLanguage(normalizedSelection);
  }
};

const persistSelectedLanguage = (value) => {
  browser.storage.local.set({
    [STORAGE_KEYS.selectedLanguage]: value,
  });
};

selectedLanguageSelect.addEventListener("change", () => {
  persistSelectedLanguage(selectedLanguageSelect.value);
});

saveButton.addEventListener("click", async () => {
  saveError.textContent = "";
  const baseUrl = rememUrlInput.value.trim();
  const url = `${baseUrl.replace(/\/$/, "")}/save_fill_gaps_card`;
  const payload = {
    dir: directoryInput.value,
    language: selectedLanguageSelect.value,
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
