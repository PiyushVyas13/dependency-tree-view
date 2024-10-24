/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.activate = activate;
exports.deactivate = deactivate;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(__webpack_require__(1));
const JavaPackageTreeProvider_1 = __webpack_require__(2);
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
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
    const structureProvider = new JavaPackageTreeProvider_1.ClassStructureProvider();
    vscode.window.registerTreeDataProvider('packageTree', new JavaPackageTreeProvider_1.JavaPackageTreeProvider(rootPath));
    vscode.window.registerTreeDataProvider('dependencyView', new JavaPackageTreeProvider_1.PackageTreeProvider('./dependencies.json', rootPath));
    vscode.window.registerTreeDataProvider('classStructure', structureProvider);
    context.subscriptions.push(disposable);
    context.subscriptions.push(vscode.commands.registerCommand('extension.refreshStructure', (element) => {
        structureProvider.refresh(element);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('extension.showClassStructure', (element) => {
        vscode.commands.executeCommand('extension.refreshStructure', element);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('extension.navigateToDeclaration', async (sourceFile, element, className) => {
        if (!element || !sourceFile) {
            vscode.window.showErrorMessage('Source file not found');
            return;
        }
        const files = await vscode.workspace.findFiles(`**/${sourceFile}`);
        if (files.length === 0) {
            vscode.window.showErrorMessage('file not found in workspace');
            return;
        }
        const document = await vscode.workspace.openTextDocument(files[0]);
        const editor = await vscode.window.showTextDocument(document);
        const text = document.getText();
        const name = element.name === '<init>' ? className.substring(className.lastIndexOf('.') + 1) : element.name;
        const index = text.indexOf(name);
        if (index === -1) {
            vscode.window.showErrorMessage('Declaration not found for ' + name + ' in sourcefile: ' + sourceFile);
            return;
        }
        const startPosition = document.positionAt(index);
        const endPosition = document.positionAt(index + element.name.length);
        const range = new vscode.Range(startPosition, endPosition);
        editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        editor.selection = new vscode.Selection(startPosition, endPosition);
    }));
}
// This method is called when your extension is deactivated
function deactivate() { }


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ClassStructureProvider = exports.PackageTreeProvider = exports.JavaPackageTreeProvider = void 0;
const vscode = __importStar(__webpack_require__(1));
const fs = __importStar(__webpack_require__(3));
const path = __importStar(__webpack_require__(4));
class JavaPackageTreeProvider {
    workspaceRoot;
    constructor(workspaceRoot) {
        this.workspaceRoot = workspaceRoot;
    }
    onDidChangeTreeData;
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.workspaceRoot) {
            vscode.window.showErrorMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
        }
        else {
            const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
            if (this.pathExists(packageJsonPath)) {
                return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
            }
            else {
                vscode.window.showErrorMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }
        }
    }
    getDepsInPackageJson(packageJsonPath) {
        if (this.pathExists(packageJsonPath)) {
            const toDep = (moduleName, version) => {
                if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
                    return new JavaElement(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
                }
                else {
                    return new JavaElement(moduleName, version, vscode.TreeItemCollapsibleState.None);
                }
            };
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const deps = packageJson.dependencies ?
                Object.keys(packageJson.dependencies).map((dep => toDep(dep, packageJson.dependencies[dep])))
                : [];
            const devDeps = packageJson.devDependencies ?
                Object.keys(packageJson.devDependencies).map((dep) => toDep(dep, packageJson.devDependencies[dep]))
                : [];
            return deps.concat(devDeps);
        }
        else {
            return [];
        }
    }
    pathExists(p) {
        try {
            fs.accessSync(p);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.JavaPackageTreeProvider = JavaPackageTreeProvider;
const formatName = (str) => {
    if (str.startsWith('.')) {
        return str.substring(1);
    }
    if (str.indexOf('.') !== -1) {
        if (str.indexOf('<') !== -1) {
            let firstPart = str.substring(0, str.indexOf('<'));
            let genericPart = str.substring(str.indexOf('<') + 1, str.indexOf('>'));
            let parts = firstPart.split('.');
            firstPart = parts[parts.length - 1];
            parts = genericPart.split('.');
            genericPart = parts[parts.length - 1];
            return firstPart + '<' + genericPart + '>';
        }
        const parts = str.split('.');
        return parts[parts.length - 1];
    }
    return str;
};
class PackageTreeProvider {
    workSpaceRoot;
    onDidChangeTreeData;
    jsonPath;
    constructor(jsonPath, workSpaceRoot) {
        this.workSpaceRoot = workSpaceRoot;
        this.jsonPath = jsonPath;
    }
    ;
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        const filePath = path.join(this.workSpaceRoot, '.vscode', 'dependencies.json');
        console.log(filePath);
        const root = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        console.log(root);
        if (!element) {
            return Promise.resolve([new ElementItem(root.name, root, vscode.TreeItemCollapsibleState.Collapsed)]);
        }
        else {
            return Promise.resolve(element.getChildren());
        }
    }
    pathExists(p) {
        try {
            fs.accessSync(p);
        }
        catch (err) {
            return false;
        }
        return true;
    }
}
exports.PackageTreeProvider = PackageTreeProvider;
class ClassStructureProvider {
    _onDidChangeTreeData = new vscode.EventEmitter();
    constructor() {
    }
    currentElement;
    refresh(element) {
        this.currentElement = element;
        this._onDidChangeTreeData.fire();
    }
    onDidChangeTreeData = this._onDidChangeTreeData.event;
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.currentElement) {
            return Promise.resolve([]);
        }
        if (!element) {
            const fields = this.currentElement.fields.map(field => new StructureTreeItem(field, this.currentElement?.sourceFile, this.currentElement?.name, vscode.TreeItemCollapsibleState.None, 'field'));
            const methods = this.currentElement.methods.map(method => (new StructureTreeItem(method, this.currentElement?.sourceFile, this.currentElement?.name, vscode.TreeItemCollapsibleState.None, 'method')));
            return Promise.resolve([...fields, ...methods]);
        }
        else {
            return Promise.resolve([]);
        }
    }
}
exports.ClassStructureProvider = ClassStructureProvider;
class JavaElement extends vscode.TreeItem {
    label;
    version;
    collapsibleState;
    constructor(label, version, collapsibleState) {
        super(label, collapsibleState);
        this.label = label;
        this.version = version;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }
}
class ElementItem extends vscode.TreeItem {
    label;
    element;
    collapsibleState;
    constructor(label, element, collapsibleState) {
        super(element.name, collapsibleState);
        this.label = label;
        this.element = element;
        this.collapsibleState = collapsibleState;
        this.tooltip = `${this.element.name}`;
        this.description = element.class ? 'Class' : 'Package';
        if (element.class) {
            this.command = {
                command: 'extension.showClassStructure',
                title: 'Show Class Structure',
                arguments: [element]
            };
        }
    }
    getChildren() {
        return this.element.elements.map((elem) => new ElementItem(formatName(elem.name), elem, elem.elements.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None));
    }
}
class StructureTreeItem extends vscode.TreeItem {
    item;
    sourceFile;
    className;
    collapsibleState;
    type;
    constructor(item, sourceFile, className, collapsibleState, type) {
        super(StructureTreeItem.getLabel(className, item, type), collapsibleState);
        this.item = item;
        this.sourceFile = sourceFile;
        this.className = className;
        this.collapsibleState = collapsibleState;
        this.type = type;
        this.tooltip = StructureTreeItem.getTooltip(item, type);
        this.iconPath = StructureTreeItem.getIconPath(item, type);
        this.command = {
            command: 'extension.navigateToDeclaration',
            title: 'Navigate to Declaration',
            arguments: [sourceFile, item, className]
        };
    }
    static getLabel(className, item, type) {
        if (type === 'field') {
            const field = item;
            return `${field.name}: ${formatName(field.type)}`;
        }
        else {
            const method = item;
            let name;
            if (method.name === '<init>') {
                name = className.substring(className.lastIndexOf('.') + 1);
            }
            else {
                name = method.name;
            }
            return `${name}(${method.parameters.join(', ')}): ${formatName(method.returnType)}`;
        }
    }
    static getTooltip(item, type) {
        if (type === 'field') {
            const field = item;
            return `${field.modifier} ${field.type} ${field.name}`;
        }
        else {
            const method = item;
            return `${method.accessModifier} ${method.returnType} ${method.name}(${method.parameters.join(', ')})`;
        }
    }
    static getIconPath(item, type) {
        const iconsFolderPath = path.join(__filename, '..', '..', 'resources', 'icons');
        let iconName = '';
        if (type === 'field') {
            const field = item;
            iconName = field.isStatic ? 'staticField' : 'field';
            iconName = field.isFinal ? `${iconName}Final` : iconName;
        }
        else {
            const method = item;
            iconName = method.isStatic ? 'staticMethod' : 'method';
            iconName = method.isAbstract ? `${iconName}Abstract` : iconName;
            iconName = method.isFinal ? `${iconName}Final` : iconName;
        }
        return {
            light: path.join(iconsFolderPath, 'light', `${iconName}.svg`),
            dark: path.join(iconsFolderPath, 'dark', `${iconName}.svg`)
        };
    }
}


/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("fs");

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("path");

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map