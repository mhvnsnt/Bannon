import ts from "typescript"
import fs from "fs"

export class RepoMapper {
  static mapDirectory(filePath: string) {
    const sourceCode = fs.readFileSync(filePath, "utf8")
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    )
    
    // Engine extracts class and function nodes for the PageRank algorithm
    return sourceFile.statements
  }
}
