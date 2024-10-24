export interface Root {
    name: string;
    elements: Element[];
    abstractClassCount: number;
    concreteClassCount: number;
    classCount: number;
    class: boolean;
    package: boolean;
}

export interface Element {
    packageName: string;
    sourceFile: string;
    signature: string;
    fields: Field[];
    methods: Method[];
    outGoingDependencies: string[];
    incomingDependencies: string[];
    interface: boolean;
    elements: Element[];
    importedPackages: ImportedPackage[];
    class: boolean;
    final: boolean;
    name: string;
    abstract: boolean;
    package: boolean;
}

export interface Method {
    accessModifier: string;
    isStatic: boolean;
    isFinal: boolean;
    isAbstract: boolean;
    name: string;
    parameters: string[];
    returnType: string;
}

export interface Field {
    name: string;
    type: string;
    isStatic: boolean;
    isFinal: boolean;
    modifier: string;
}

export interface ImportedPackage {
    name: string;
    elements: any[];
    abstractClassCount: number;
    concreteClassCount: number;
    classCount: number;
    class: boolean;
    package: boolean;
}