const vscode = require("vscode");
const { open, readFile, access, constants, unlink } = require("fs/promises");

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
    const assets = await getAssets();
    vscode.window.showInformationMessage("Total Asset Count: " + assets.length);
    const components = await getComponents();
    vscode.window.showInformationMessage("Total Component Count: " + components.length);
    let unusedAssetPaths = [];

    for (let i = 0; i < assets.length; i++) {
      let fileName = getFileName(assets[i]);
      if (!(await isFileUsing(fileName, components))) {
        unusedAssetPaths.push(assets[i].fsPath);
      }
    }
    await createUnusedAssetsFile(unusedAssetPaths);
    vscode.window.showInformationMessage(
      "Done! Unused Asset Files Count: " + unusedAssetPaths.length.toString()
    );
  }
}

async function removeUnusedAssets() {
  if (await isRemovable()) {
    const file = await open(getUnusedAssetsFilePath());
    const unusedAssets = (await readFile(file)).toString().split("\n");
    for (let i = 0; i < unusedAssets.length; i++) {
      unlink(unusedAssets[i]);
    }
    await file.close();
    unlink(getUnusedAssetsFilePath());
    vscode.window.showInformationMessage("Done! All unused assets were deleted.");
  }
}

async function isFindable() {
  if (isWorkspaceOpen()) {
    return await hasSrcFolder();
  } else return false;
}

async function isRemovable() {
  if (isWorkspaceOpen() && (await hasSrcFolder()) && (await hasUnusedAssetsFile())) return true;
  else return false;
}

async function hasUnusedAssetsFile() {
  try {
    await access(getUnusedAssetsFilePath(), constants.R_OK);
    return true;
  } catch (error) {
    vscode.window.showErrorMessage(
      "The UnusedAssets.txt file not found. Please run 'Find Unused Assets' command first."
    );
    return false;
  }
}

async function createUnusedAssetsFile(assetPaths) {
  try {
    const file = await open(getUnusedAssetsFilePath(), "w");
    await file.writeFile("");
    if (assetPaths.length > 0) {
      await file.appendFile(assetPaths[0]);
      for (let i = 1; i < assetPaths.length; i++) {
        await file.appendFile("\n");
        await file.appendFile(assetPaths[i]);
      }
    }
    await file.close();
  } catch (error) {
    vscode.window.showErrorMessage(
      "Something went wrong when creating UnusedAssets.txt file: \n" + error.message
    );
  }
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

function getUnusedAssetsFilePath() {
  return vscode.Uri.joinPath(vscode.workspace.workspaceFolders[0].uri, "UnusedAssets.txt").fsPath;
}

function getFileName(uri) {
  return uri.path.split("/").pop();
}

async function getAssets() {
  return await vscode.workspace.findFiles("src/**/*.{png,jpg,jpeg,gif,svg}");
}

async function getComponents() {
  return await vscode.workspace.findFiles("src/**/*.{html,css,js,jsx}");
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
