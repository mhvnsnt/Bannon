import { Response } from 'express';

export class AutonomousStreamer {
  private res: Response;

  constructor(res: Response) {
    this.res = res;
    // Set headers if not already set or needing refresh
    this.res.setHeader('Content-Type', 'text/event-stream');
    this.res.setHeader('Cache-Control', 'no-cache');
    this.res.setHeader('Connection', 'keep-alive');
  }

  send(data: any) {
    this.res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  text(text: string) {
    this.send({ text });
  }

  toolCall(toolCall: any) {
    this.send({ toolCalls: [toolCall] });
  }

  error(error: string) {
    this.send({ error });
  }

  done(node?: string) {
    this.send({ done: true, node });
  }

  end() {
    this.res.end();
  }
}
