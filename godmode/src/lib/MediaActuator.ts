export class MediaActuator {
  static async synthesizeImage(prompt: string): Promise<string> {
    console.log(`[MediaActuator] Generating: ${prompt}`);
    return "https://placehold.co/600x400/png";
  }
}
