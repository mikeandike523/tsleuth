export type FunctionLikeNodeKind =
  | 'FunctionDecl'
  | 'Method'
  | 'Constructor'
  | 'GetAccessor'
  | 'SetAccessor';

export function isFunctionLikeNodeKind(
  kind: NodeKind
): kind is FunctionLikeNodeKind {
  return (
    kind === 'FunctionDecl' ||
    kind === 'Method' ||
    kind === 'Constructor' ||
    kind === 'GetAccessor' ||
    kind === 'SetAccessor'
  );
}

/**
 * The kinds of symbols that are supported by the documentation generator
 */
export type NodeKind =
  | 'VariableDecl'
  | 'Property'
  | 'Class'
  | 'Method'
  | 'Interface'
  | 'Enum'
  | 'EnumMember'
  | 'TypeAlias'
  | FunctionLikeNodeKind;

/**
 * Storage Qualifier for entities outside a class
 */
export type StorageQualifier = 'Var' | 'Let' | 'Const';

/**
 * Storage Qualifier for entities inside a class
 */
export type ClassStorageQualifier = 'Static';

/**
 * Access qualifier for entities inside a class
 */
export type ClassAccessQualifier = 'Public' | 'Protected' | 'Private';

/**
 * export qualifier for entities outside a class
 */
export type ExportQualifier = 'Export' | 'ExportDefault';

/**
 * Holds line and column number, 0-indexed
 */
export type SourceCodePosition = {
  line: number;
  column: number;
};

/**
 * Store data about a ts.Node that is relevant to documentation generation.
 * Has optional references to parent and child NodeInfo so the generated HTML pages can have hiearchical content
 */
export type NodeInfo = {
  /**
   * The name of the node
   *
   * @remarks
   * optional because it could be anonymous
   */
  name?: string;
  /**
   * The kind of the node
   *
   * @remarks
   * optional because it could be unknown
   */
  kind?: NodeKind;
  /**
   * Simply populated by `ts.SyntaxKind[node.kind]` (i.e. enum reverse mapping)
   */
  tsKindShort: string;
  /**
   * A full summary of the ts.Kind name and number of the node
   */
  tsKindString: string;
  /**
   * The storage qualifier for the node if present and relevant
   *
   * @remarks
   * optional because it could be absent or not relevant
   */
  storageQualifier?: StorageQualifier;
  /**
   * The class member access qualifier for the node if present and relevant
   *
   * @remarks
   * optional because it could be absent or not relevant
   *
   * */
  classStorageQualifier?: ClassStorageQualifier;
  /**
   * The class member access qualifier for the node if present and relevant
   *
   * @remarks
   * optional because it could be absent or not relevant
   */
  classAccessQualifier?: ClassAccessQualifier;

  /**
   * The export qualityifier for the node if present and relevant
   *
   * @remarks
   * optional because it could be absent or not relevant
   */
  exportQualifier?: ExportQualifier;

  /**
   * Whether or not the symbol is inside a class
   *
   * @remarks
   * It could be inferred from the parent chain but that seems unnecessary
   */
  isMemberOfClass?: boolean;
  /**
   * The children of the node (if present)
   *
   * @remarks
   * does not need to be optional since an empty array means a leaf node (node without children)
   */
  children: NodeInfo[];
  /**
   * The documentation (from the docstring) of the symbol if present
   *
   * @remarks
   * Generally, it should be present as this library is being designed to skip nondocumented symbols. Its good for optimization
   */
  documentation?: string;
  /**
   * The source code representing the signature of a function type
   */
  signatureSourceCode?: string;
  /** The start of the symbol */
  startChar: number;
  /** The end of the symbol */
  endChar: number;
  /** The source code of the symbol, which is cached here since its faster then constantly getting a substring of the full source code */
  sourceCode: string;
  /**
   * A uuid when traversing the AST, although it will just be calculated form the start and end chars
   */
  uuid: string;
  /**
   * A chain of keys identifying parents of a node by name
   */
  nameChain: string[];
  /**
   * A chain of keys identifying parents of a node by uuid
   */
  uuidChain: string[];
};

/**
 * Creates a trivial NodeInfo, typically the root in a SourceFileInfo object
 */
export function createEmptyNodeInfo(): NodeInfo {
  return {
    tsKindShort: '',
    tsKindString: '',
    name: '',
    kind: undefined,
    storageQualifier: undefined,
    classStorageQualifier: undefined,
    classAccessQualifier: undefined,
    isMemberOfClass: undefined,
    children: [],
    documentation: undefined,
    startChar: -1,
    endChar: -1,
    sourceCode: '',
    uuid: '',
    nameChain: [],
    uuidChain: [],
  };
}

/**
 * Instead of having the top level of the tree be just a NodeInfo, since the typescript API does not consider the module itself a node, then we should also treat the top level seperately
 *
 * In the case of the typescript API, the top level is called a "SourceFile"
 */
export type SourceFileInfo = {
  absolutePath: string;
  root: NodeInfo;
};
