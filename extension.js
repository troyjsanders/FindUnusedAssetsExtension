const vscode = require("vscode");

/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  let disposableFindUnusedAssets = vscode.commands.registerCommand(
    "FUA.findUnusedAssets",
    await findUnusedAssets
  );
  let disposableRemoveUnusedAssets = vscode.commands.registerCommand(
    "FUA.removeUnusedAssets",
    await removeUnusedAssets
  );

  context.subscriptions.push(disposableFindUnusedAssets);
  context.subscriptions.push(disposableRemoveUnusedAssets);
}

async function findUnusedAssets() {
  if (await isFindable()) {
    vscode.window.showInformationMessage("works!");
    let workspacePath = vscode.workspace.workspaceFolders[0].uri.path;
    let workspaceFsPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
    // Continue with your logic here
  }
}

async function isFindable() {
  if (isWorkspaceOpen()) {
    return await hasSrcFolder();
  } else return false;
}

async function hasSrcFolder() {
  const files = await vscode.workspace.findFiles("src/**", "", 1);
  if (!files || files.length === 0) {
    vscode.window.showInformationMessage("src folder not found.");
    return false;
  } else return true;
}

function isWorkspaceOpen() {
  if (!vscode.workspace.workspaceFolders) {
    vscode.window.showErrorMessage("Please open a workspace/folder for using this command.");
    return false;
  } else return true;
}

async function removeUnusedAssets() {}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
