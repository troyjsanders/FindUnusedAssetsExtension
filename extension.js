const vscode = require("vscode");
const { open, readFile, unlink } = require("fs/promises");


/**
 * @param {vscode.ExtensionContext} context
 */
async function activate(context) {
  let disposableFindUnusedAssets = vscode.commands.registerCommand(
    "FUA.findUnusedAssets",
    findUnusedAssets
  );
  let disposableRemoveUnusedAssets = vscode.commands.registerCommand(
    "FUA.removeUnusedAssets",
    removeUnusedAssets
  );
  let disposableRemoveUnusedReactFiles = vscode.commands.registerCommand(
    "FUA.removeUnusedReactFiles",
    removeUnusedReactFiles
  );
  let disposableRemoveAllUnusedFiles = vscode.commands.registerCommand(
    "FUA.removeAllUnusedFiles",
    removeAllUnusedFiles
  );

  context.subscriptions.push(disposableFindUnusedAssets);
  context.subscriptions.push(disposableRemoveUnusedAssets);
  context.subscriptions.push(disposableRemoveUnusedReactFiles);
  context.subscriptions.push(disposableRemoveAllUnusedFiles);
}

async function findUnusedAssets() {
  if (await isRemovable()) {
    const assets = await getAssets();
    const components = await getReactFiles();
    const unusedAssets = await findUnusedFiles(assets, components);
    
    vscode.window.showInformationMessage(
      `Found ${unusedAssets.length} unused assets.`
    );
    
    // Optionally, you can show the list of unused assets
    if (unusedAssets.length > 0) {
      const result = await vscode.window.showQuickPick(['Yes', 'No'], {
        placeHolder: 'Do you want to see the list of unused assets?'
      });
      if (result === 'Yes') {
        vscode.window.showInformationMessage(unusedAssets.join('\n'));
      }
    }
  }
}


async function findUnusedFiles(files, components) {
  let unusedFilePaths = [];
  for (let i = 0; i < files.length; i++) {
    let fileName = getFileName(files[i]);
    if (!(await isFileUsing(fileName, components))) {
      unusedFilePaths.push(files[i].fsPath);
    }
  }
  return unusedFilePaths;
}

async function removeUnusedAssets() {
  if (await isRemovable()) {
    const assets = await getAssets();
    const components = await getReactFiles();
    const unusedAssets = await findUnusedFiles(assets, components);
    await removeFiles(unusedAssets);
    vscode.window.showInformationMessage(`Removed ${unusedAssets.length} unused assets.`);
  }
}

async function removeUnusedReactFiles() {
  if (await isRemovable()) {
    const reactFiles = await getReactFiles();
    const unusedReactFiles = await findUnusedFiles(reactFiles, reactFiles);
    await removeFiles(unusedReactFiles);
    vscode.window.showInformationMessage(`Removed ${unusedReactFiles.length} unused React files.`);
  }
}

async function removeAllUnusedFiles() {
  if (await isRemovable()) {
    const assets = await getAssets();
    const reactFiles = await getReactFiles();
    const allFiles = [...assets, ...reactFiles];
    const unusedFiles = await findUnusedFiles(allFiles, reactFiles);
    await removeFiles(unusedFiles);
    vscode.window.showInformationMessage(`Removed ${unusedFiles.length} unused files.`);
  }
}

async function removeFiles(filePaths) {
  for (let i = 0; i < filePaths.length; i++) {
    await unlink(filePaths[i]);
  }
}

async function isRemovable() {
  return isWorkspaceOpen() && await hasSrcFolder();
}

async function isFileUsing(fileName, components) {
  let isUsing = false;
  try {
    for (let i = 0; i < components.length; i++) {
      const file = await open(components[i].fsPath, "r");
      if ((await readFile(file)).toString().includes(fileName)) {
        isUsing = true;
        await file.close();
        break;
      }
      await file.close();
    }
  } catch (error) {
    vscode.window.showErrorMessage("Got an error trying to check the file using: " + error.message);
  }
  return isUsing;
}

function getFileName(uri) {
  return uri.path.split("/").pop();
}

async function getAssets() {
  return await vscode.workspace.findFiles("src/**/*.{png,jpg,jpeg,gif,svg,mp4}");
}

async function getReactFiles() {
  return await vscode.workspace.findFiles("src/**/*.{html,css,js,jsx,ts,tsx}");
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

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
