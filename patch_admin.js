const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\saull\\OneDrive\\Documentos\\Ana Fonseca\\SIte Casamento\\js\\pages\\admin-page.mjs';

let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update dom object
const domOld = 'familyResetButton: $("#familyResetButton"),';
const domNew = 'familyResetButton: $("#familyResetButton"),\n  familyIndividualButton: $("#familyIndividualButton"),\n  adminIndividualGuestButton: $("#adminIndividualGuestButton"),';
content = content.replace(domOld, domNew);

// 2. Update state object
const stateOld = 'familySlugEditorVisible: false,';
const stateNew = 'familySlugEditorVisible: false,\n  isIndividualMode: false,';
content = content.replace(stateOld, stateNew);

// 3. Update addGuestInputLine
const guestNew = `  input.placeholder = "Ex.: João Silva";
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

if (content.includes('input.placeholder = "Ex.: Jo\\u00E3o Silva";\n  input.value = initialValue;')) {
    content = content.replace('input.placeholder = "Ex.: Jo\\u00E3o Silva";\n  input.value = initialValue;', guestNew);
} else if (content.includes('input.placeholder = "Ex.: João Silva";\n  input.value = initialValue;')) {
    content = content.replace('input.placeholder = "Ex.: João Silva";\n  input.value = initialValue;', guestNew);
}

// Add focus and wrapper appends
content = content.replace('dom.familyGuestsContainer.appendChild(wrapper);', 'dom.familyGuestsContainer.appendChild(wrapper);\n  \n  if (state.isIndividualMode && dom.familyGuestsContainer.children.length === 1) {\n    input.focus();\n  }');

// 4. Update openNewFamilyEditor and add openIndividualGuestEditor
const editorOld = `function openNewFamilyEditor() {
  fillFamilyForm(null);
  state.lastSavedInviteUrl = "";
  renderSavedFamilyActions();
  setCurrentStep("families");
}`;
const editorNew = `function openNewFamilyEditor() {
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
content = content.replace(editorOld, editorNew);

// 5. Update primaryStepAction
const primaryOld = `  if (state.step === "families") {
    openNewFamilyEditor();
    return;
  }`;
const primaryNew = `  if (state.step === "families") {
    if (state.isIndividualMode) {
      openIndividualGuestEditor();
    } else {
      openNewFamilyEditor();
    }
    return;
  }`;
content = content.replace(primaryOld, primaryNew);

// 6. Add event listeners
const listenerOld = 'dom.familyResetButton.addEventListener("click", openNewFamilyEditor);';
const listenerNew = 'dom.familyResetButton.addEventListener("click", openNewFamilyEditor);\n  dom.familyIndividualButton.addEventListener("click", openIndividualGuestEditor);\n  dom.adminIndividualGuestButton.addEventListener("click", openIndividualGuestEditor);';
content = content.replace(listenerOld, listenerNew);

fs.writeFileSync(filePath, content, 'utf-8');

console.log("Patch applied successfully via Node.js!");
