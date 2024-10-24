// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ClassStructureProvider, JavaPackageTreeProvider, PackageTreeProvider } from './providers/JavaPackageTreeProvider';
import { Element, Field, Method, Root } from './tokens/root';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "dependency-tree-view" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	const disposable = vscode.commands.registerCommand('dependency-tree-view.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from dependency-tree-view!');
	});

	const rootPath = vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0 ? vscode.workspace.workspaceFolders[0].uri.fsPath : '.';
	
	const structureProvider = new ClassStructureProvider();
	
	vscode.window.registerTreeDataProvider('packageTree', new JavaPackageTreeProvider(rootPath));
	vscode.window.registerTreeDataProvider('dependencyView', new PackageTreeProvider('./dependencies.json', rootPath));
	vscode.window.registerTreeDataProvider('classStructure', structureProvider);
	context.subscriptions.push(disposable);
	

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.refreshStructure', (element: Element) => {
			structureProvider.refresh(element);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.showClassStructure', (element) => {
			vscode.commands.executeCommand('extension.refreshStructure', element);
		})
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('extension.navigateToDeclaration', async (sourceFile: string, element: Field | Method, className: string) => {
			if(!element || !sourceFile) {
				vscode.window.showErrorMessage('Source file not found');
				return;
			}

			const files = await vscode.workspace.findFiles(`**/${sourceFile}`);

			if(files.length === 0) {
				vscode.window.showErrorMessage('file not found in workspace');
				return;
			}

			const document = await vscode.workspace.openTextDocument(files[0]);
			const editor = await vscode.window.showTextDocument(document);

			const text = document.getText();
			const name = element.name === '<init>' ? className.substring(className.lastIndexOf('.')+1): element.name;
			const index = text.indexOf(name);

			if(index === -1) {
				vscode.window.showErrorMessage('Declaration not found for ' + name + ' in sourcefile: '+ sourceFile);
				return;
			}

			const startPosition = document.positionAt(index);
			const endPosition = document.positionAt(index + element.name.length);
			const range = new vscode.Range(startPosition, endPosition);

			editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
			editor.selection = new vscode.Selection(startPosition, endPosition);
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
