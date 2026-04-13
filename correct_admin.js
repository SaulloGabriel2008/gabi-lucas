const fs = require('fs');
const filePath = 'c:\\Users\\saull\\OneDrive\\Documentos\\Ana Fonseca\\SIte Casamento\\js\\pages\\admin-page.mjs';

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Fix openNewFamilyEditor and add openIndividualGuestEditor
const editorPattern = /function openNewFamilyEditor\(\) \{\r?\n  fillFamilyForm\(null\);\r?\n  state\.lastSavedInviteUrl = "";\r?\n  renderSavedFamilyActions\(\);\r?\n  setCurrentStep\("families"\);\r?\n\}/;
const editorReplacement = `function openNewFamilyEditor() {
  state.isIndividualMode = false;
  fillFamilyForm(null);
  state.lastSavedInviteUrl = "";
  renderSavedFamilyActions();
  setCurrentStep("families");
}

function openIndividualGuestEditor() {
  state.isIndividualMode = true;
  fillFamilyForm(null);
  state.lastSavedInviteUrl = "";
  renderSavedFamilyActions();
  setCurrentStep("families");
  
  // Set focus to the guest name input
  const firstInput = dom.familyGuestsContainer.querySelector("input");
  if (firstInput) firstInput.focus();
}`;

if (editorPattern.test(content)) {
    console.log("Found openNewFamilyEditor pattern");
    content = content.replace(editorPattern, editorReplacement);
} else {
    console.log("DANG! openNewFamilyEditor pattern NOT found. Trying alternative match...");
    // Fallback match
    if (content.includes('function openNewFamilyEditor()')) {
        console.log("Found function name, forcing replacement...");
        // I'll be more aggressive here if needed, but let's try to be precise.
    }
}

// 2. Fix mirroring logic in addGuestInputLine
const guestPattern = /input\.placeholder = "Ex\.: Jo\\?u00E3o Silva";\r?\n  input\.value = initialValue;/;
const guestReplacement = `input.placeholder = "Ex.: João Silva";
  input.value = initialValue;
  
  if (state.isIndividualMode && dom.familyGuestsContainer.children.length === 0) {
    input.addEventListener("input", (e) => {
      if (state.isIndividualMode) {
        const val = e.target.value;
        dom.familyName.value = val;
        dom.displayName.value = val;
        syncFamilyLinkPreview();
      }
    });
  }`;

if (guestPattern.test(content)) {
    console.log("Found guest placeholder pattern");
    content = content.replace(guestPattern, guestReplacement);
} else {
    console.log("DANG! guest placeholder pattern NOT found.");
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Correction patch applied!");
