import ts from "typescript";

export class LSPBridge {
  private static program: ts.Program | null = null;

  /**
   * Initializes the TypeScript compiler API wrapper
   */
  static initialize(rootFiles: string[]) {
    this.program = ts.createProgram(rootFiles, {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
    });
    console.log("[LSP Bridge] TypeScript compiler API initialized.");
  }

  /**
   * Returns compiler diagnostics (type-checking and syntax errors) for a file
   */
  static getDiagnostics(filePath: string) {
    if (!this.program) throw new Error("LSP Bridge not initialized. Call initialize() first.");
    
    const sourceFile = this.program.getSourceFile(filePath);
    if (!sourceFile) throw new Error("File not found in program graph");

    const diagnostics = ts.getPreEmitDiagnostics(this.program, sourceFile);
    return diagnostics.map(d => {
      if (d.file) {
        const { line, character } = ts.getLineAndCharacterOfPosition(d.file, d.start!);
        const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
        return `Error ${d.file.fileName} (${line + 1},${character + 1}): ${message}`;
      } else {
        return ts.flattenDiagnosticMessageText(d.messageText, "\n");
      }
    });
  }

  /**
   * Retrieves AST symbol definitions (Mock structure for Go to Definition)
   */
  static getSymbolDefinition(symbolName: string) {
    console.log(`[LSP Bridge] Querying definitions for symbol: ${symbolName}`);
    return {
      symbol: symbolName,
      status: "located",
      references: 4
    };
  }
}
