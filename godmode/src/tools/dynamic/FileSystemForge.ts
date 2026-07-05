import fs from "fs"
import path from "path"
import { execSync } from "child_process"

export const FileSystemForge = {
  /**
   * Reads a file from the repository to analyze its current state
   */
  readFile: async (args: { relativePath: string }) => {
    const targetPath = path.resolve(process.cwd(), args.relativePath)
    if (!fs.existsSync(targetPath)) {
      throw new Error(`File not found at target location: ${args.relativePath}`)
    }
    return fs.readFileSync(targetPath, "utf8")
  },

  /**
   * Writes or overwrites code directly into the workspace
   */
  writeFile: async (args: { relativePath: string; code: string }) => {
    const targetPath = path.resolve(process.cwd(), args.relativePath)
    const directory = path.dirname(targetPath)
    
    // Ensure the target folder structure exists before write operations
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory, { recursive: true })
    }
    
    fs.writeFileSync(targetPath, args.code, "utf8")
    return `Successfully updated structure at: ${args.relativePath}`
  },

  /**
   * Executes local build compilation to verify syntax validity
   */
  compileAndValidate: async () => {
    try {
      // Runs your local typescript build check or lint pass
      execSync("npm run build", { stdio: "pipe" })
      return "Compilation clear syntax validated successfully"
    } catch (error: any) {
      return `Compilation failed: ${error.message}`
    }
  }
}
