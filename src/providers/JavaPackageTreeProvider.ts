import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Element, Field, Method, Root } from '../tokens/root';

export class JavaPackageTreeProvider implements vscode.TreeDataProvider<JavaElement> {
    constructor(private workspaceRoot: string) {}
    
    onDidChangeTreeData?: vscode.Event<void | JavaElement | JavaElement[] | null | undefined> | undefined;
    
    getTreeItem(element: JavaElement): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    
    getChildren(element?: JavaElement | undefined): vscode.ProviderResult<JavaElement[]> {
        if(!this.workspaceRoot) {
            vscode.window.showErrorMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }

        if(element) {
            return Promise.resolve(
                this.getDepsInPackageJson(
                    path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')
                )
            );
        } else {
            const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
            if(this.pathExists(packageJsonPath)) {
                return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
            } else {
                vscode.window.showErrorMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }
        }
    }

    private getDepsInPackageJson(packageJsonPath: string): JavaElement[] {
        if(this.pathExists(packageJsonPath)) {
            const toDep = (moduleName: string, version: string) : JavaElement => {
                if(this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
                    return new JavaElement(moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
                } else {
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
        } else {
            return [];
        }
    }

    private pathExists(p: string) : boolean {
        try {
            fs.accessSync(p);
        } catch(err) {
            return false;
        }
        return true;
    }

}

const formatName = (str: string) : string => {
    if(str.startsWith('.')) {
        return str.substring(1);
    }

    if(str.indexOf('.') !== -1) {

        if(str.indexOf('<') !== -1) {
            let firstPart = str.substring(0, str.indexOf('<'));
            let genericPart = str.substring(str.indexOf('<')+1, str.indexOf('>'));

            let parts: string[] = firstPart.split('.');
            firstPart = parts[parts.length-1];
            parts = genericPart.split('.');
            genericPart = parts[parts.length-1];

            return firstPart + '<' + genericPart + '>';
        }

        const parts: string[] = str.split('.');
        return parts[parts.length - 1];
    }

    return str;
    
};

export class PackageTreeProvider implements vscode.TreeDataProvider<ElementItem> {
    onDidChangeTreeData?: vscode.Event<void | ElementItem | ElementItem[] | null | undefined> | undefined;

    private jsonPath: string;

    constructor(
        jsonPath: string,
        private workSpaceRoot: string
    ) {
        this.jsonPath = jsonPath;
    };
    
    getTreeItem(element: ElementItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    
    getChildren(element?: ElementItem | undefined): vscode.ProviderResult<ElementItem[]> {
        
        const filePath = path.join(this.workSpaceRoot, '.vscode', 'dependencies.json');
        console.log(filePath);
        const root: Element = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as Element;

        console.log(root);
        
        if(!element) {
            return Promise.resolve([new ElementItem(root.name, root, vscode.TreeItemCollapsibleState.Collapsed)]);
        } else {
            return Promise.resolve(element.getChildren());
        }

    }

    private pathExists(p: string) : boolean {
        try {
            fs.accessSync(p);
        } catch(err) {
            return false;
        }
        return true;
    }

}

export class ClassStructureProvider implements vscode.TreeDataProvider<StructureTreeItem<Field | Method>> {
    private _onDidChangeTreeData: vscode.EventEmitter<StructureTreeItem<Field | Method> | undefined | void>  = new vscode.EventEmitter<StructureTreeItem<Field|Method> | undefined | void>();
    
    constructor(
    ) {
        
    }

    private currentElement: Element | undefined;

    public refresh(element: Element | undefined): void {
        this.currentElement = element;
        this._onDidChangeTreeData.fire();
    }
    
    onDidChangeTreeData?: vscode.Event<void | StructureTreeItem<Field | Method> | StructureTreeItem<Field | Method>[] | null | undefined> | undefined = this._onDidChangeTreeData.event;
    
    
    getTreeItem(element: StructureTreeItem<Field | Method>): vscode.TreeItem | Thenable<vscode.TreeItem> {
        return element;
    }
    
    
    getChildren(element?: StructureTreeItem<Field | Method> | undefined): vscode.ProviderResult<StructureTreeItem<Field | Method>[]> {
        if(!this.currentElement) {
            return Promise.resolve([]);
        }

        if(!element) {
            const fields = this.currentElement.fields.map(field => 
                new StructureTreeItem<Field>(field, this.currentElement?.sourceFile!, this.currentElement?.name!, vscode.TreeItemCollapsibleState.None, 'field')
            );

            const methods = this.currentElement.methods.map(method => (
                new StructureTreeItem<Method>(method, this.currentElement?.sourceFile!, this.currentElement?.name!, vscode.TreeItemCollapsibleState.None, 'method')
            ));

            return Promise.resolve([...fields, ...methods]);
        } else {
            return Promise.resolve([]);
        }
    }
    
    
}

class JavaElement extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        private version: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(label, collapsibleState);
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
    }
}

class ElementItem extends vscode.TreeItem {
    constructor(
        public readonly label: string,
        public readonly element: Element,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState
    ) {
        super(element.name, collapsibleState);
        this.tooltip = `${this.element.name}`;
        this.description = element.class ? 'Class' : 'Package';

        if(element.class) {
            this.command = {
                command: 'extension.showClassStructure',
                title: 'Show Class Structure',
                arguments: [element]
            };
        }
    }

    public getChildren() : ElementItem[] {
        return this.element.elements.map((elem) => 
            new ElementItem(formatName(elem.name), elem, elem.elements.length > 0 ? vscode.TreeItemCollapsibleState.Expanded : vscode.TreeItemCollapsibleState.None)
        );
    }
}

class StructureTreeItem<T> extends vscode.TreeItem {
    constructor(
        public readonly item: T,
        public readonly sourceFile: string,
        public readonly className: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly type: 'field' | 'method'
    ) {
        super(StructureTreeItem.getLabel(className, item, type), collapsibleState);
        this.tooltip = StructureTreeItem.getTooltip(item, type);
        this.iconPath = StructureTreeItem.getIconPath(item, type);

        this.command = {
            command: 'extension.navigateToDeclaration',
            title: 'Navigate to Declaration',
            arguments: [sourceFile, item, className]
        };
    }

    public static getLabel<T>(className: string, item: T, type: 'field' | 'method') : string {
        if(type === 'field') {
            const field = item as Field;
            return `${field.name}: ${formatName(field.type)}`;
        } else {
            const method = item as Method;

            let name: string;
            if(method.name === '<init>') {
                name = className.substring(className.lastIndexOf('.')+1);
            } else {
                name = method.name;
            }


            return `${name}(${method.parameters.join(', ')}): ${formatName(method.returnType)}`;
        }
    }

    public static getTooltip<T>(item: T, type: 'field' | 'method') : string {
        if (type === 'field') {
            const field = item as Field;
            return `${field.modifier} ${field.type} ${field.name}`;
        } else {
            const method = item as Method;
            return `${method.accessModifier} ${method.returnType} ${method.name}(${method.parameters.join(', ')})`;
        }
    }

    public static getIconPath<T>(item: T, type: 'field' | 'method'): { light: string; dark: string } {
        const iconsFolderPath = path.join(__filename, '..', '..', 'resources', 'icons');
        let iconName = '';

        if (type === 'field') {
            const field = item as Field;
            iconName = field.isStatic ? 'staticField' : 'field';
            iconName = field.isFinal ? `${iconName}Final` : iconName;
        } else {
            const method = item as Method;
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