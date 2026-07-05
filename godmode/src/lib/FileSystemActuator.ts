export class FileSystemActuator {
  static async readFile(path: string): Promise<string> {
    console.log(`[FileSystemActuator] Reading ${path}`);
    return "MOCK_FILE_CONTENT";
  }
  static async writeFile(path: string, content: string): Promise<void> {
    console.log(`[FileSystemActuator] Writing to ${path}`);
  }
}
