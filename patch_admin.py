import os

file_path = r'c:\Users\saull\OneDrive\Documentos\Ana Fonseca\SIte Casamento\js\pages\admin-page.mjs'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update dom object
dom_old = '  familyResetButton: $("#familyResetButton"),'
dom_new = '  familyResetButton: $("#familyResetButton"),\n  familyIndividualButton: $("#familyIndividualButton"),\n  adminIndividualGuestButton: $("#adminIndividualGuestButton"),'
content = content.replace(dom_old, dom_new)

# 2. Update state object
state_old = '  familySlugEditorVisible: false,'
state_new = '  familySlugEditorVisible: false,\n  isIndividualMode: false,'
content = content.replace(state_old, state_new)

# 3. Update addGuestInputLine
guest_old = '  input.placeholder = "Ex.: Jo\\u00E3o Silva";\n  input.value = initialValue;'
# Note: In the file it might be Jo\u00E3o or João. Let's try both or just look for the first part.
guest_new = '''  input.placeholder = "Ex.: João Silva";
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
  }'''
# Using a simpler match for guest input
if 'input.placeholder = "Ex.: Jo\\u00E3o Silva";' in content:
    content = content.replace('input.placeholder = "Ex.: Jo\\u00E3o Silva";\n  input.value = initialValue;', guest_new)
elif 'input.placeholder = "Ex.: João Silva";' in content:
    content = content.replace('input.placeholder = "Ex.: João Silva";\n  input.value = initialValue;', guest_new)

# Add focus and wrapper appends
content = content.replace('dom.familyGuestsContainer.appendChild(wrapper);', 'dom.familyGuestsContainer.appendChild(wrapper);\n  \n  if (state.isIndividualMode && dom.familyGuestsContainer.children.length === 1) {\n    input.focus();\n  }')

# 4. Update openNewFamilyEditor and add openIndividualGuestEditor
editor_old = '''function openNewFamilyEditor() {
  fillFamilyForm(null);
  state.lastSavedInviteUrl = "";
  renderSavedFamilyActions();
  setCurrentStep("families");
}'''
editor_new = '''function openNewFamilyEditor() {
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
}'''
content = content.replace(editor_old, editor_new)

# 5. Update primaryStepAction
primary_old = '''  if (state.step === "families") {
    openNewFamilyEditor();
    return;
  }'''
primary_new = '''  if (state.step === "families") {
    if (state.isIndividualMode) {
      openIndividualGuestEditor();
    } else {
      openNewFamilyEditor();
    }
    return;
  }'''
content = content.replace(primary_old, primary_new)

# 6. Add event listeners
listener_old = '  dom.familyResetButton.addEventListener("click", openNewFamilyEditor);'
listener_new = '  dom.familyResetButton.addEventListener("click", openNewFamilyEditor);\n  dom.familyIndividualButton.addEventListener("click", openIndividualGuestEditor);\n  dom.adminIndividualGuestButton.addEventListener("click", openIndividualGuestEditor);'
content = content.replace(listener_old, listener_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied successfully!")
