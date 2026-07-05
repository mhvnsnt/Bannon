export class TermuxBridge {
  static async executeCommand(command: string): Promise<string> {
    console.log(`[TermuxBridge] Executing: ${command}`);
    return "COMMAND_SUCCESS";
  }
}
