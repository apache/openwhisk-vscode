# Packaging the VSCode extension for release

All based on information here: https://code.visualstudio.com/docs/extensions/publish-extension

## Packaging a VS Code extension for local distribution.

1. cd into the project root directory (this is the one that contains `package.json`)
2. Update the `version` value in `package.json` (this can be manual or using `npm version`)
3. Run the command `vsce package` - this compiles the .vsix file for release, which can be installed into vscode.  This file can be uploaded into the "Releases" section on github

----

## Packaging for remote distribution in windows marketplace:

1. cd into the project root directory (this is the one that contains `package.json`)
2. Update the `version` value in `package.json` (this can be manual or using `npm version`)
3. Run the command `vsce publish` - This compiles the extension and publishes to the windows marketplace in one step. ***This requires an account with sufficient priveleges

