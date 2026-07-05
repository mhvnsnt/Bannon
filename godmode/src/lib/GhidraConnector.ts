import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);

// Custom Agent Tool: Ghidra Headless Connector
export async function executeStructuralMapping(binaryPath: string): Promise<string> {
  console.log(`[GHIDRA CONNECTOR] Initiating structural intent mapping on ${binaryPath}`);
  
  const ghidraHeadlessPath = "/opt/ghidra/support/analyzeHeadless";
  const projectDirectory = "/app/data/ghidra_projects";
  const projectName = "AutoAnalysis";
  const extractionScript = "DecompileToC.java"; // A standard Ghidra export script

  try {
    // Executes Ghidra completely invisibly in the background, runs the decompiler, and spits out the AST
    const { stdout } = await execAsync(
      `${ghidraHeadlessPath} ${projectDirectory} ${projectName} -import ${binaryPath} -postScript ${extractionScript} -deleteProject`
    );
    
    return `Structural Mapping Complete. Decompiled Logic: \n${stdout}`;
  } catch (error: any) {
    return `Mapping failed: ${error.message}`;
  }
}
