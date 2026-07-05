export interface AgentCard {
  name: string;
  description: string;
  url: string;
  version: string;
  skills: any[];
}

export interface TaskContext {
  request: { params: any };
  respond: (result: any) => void;
}

export class A2AServer {
  private card: AgentCard;
  private tasks: Map<string, Function> = new Map();

  constructor(config: { card: AgentCard }) {
    this.card = config.card;
  }

  onTask(skillId: string, handler: Function) {
    this.tasks.set(skillId, handler);
  }

  handleRequest(req: any, res: any) {
    const { skillId, payload } = req.body;
    const handler = this.tasks.get(skillId);
    if (handler) {
      const context: TaskContext = {
        request: { params: payload },
        respond: (result) => res.json(result)
      };
      handler(context);
    } else {
      res.status(404).json({ error: "Skill not found" });
    }
  }
}

export class A2AClient {
  constructor(private url: string) {}

  async sendTask(skillId: string, payload: any) {
    const res = await fetch(`${this.url}/a2a/rpc`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skillId, payload })
    });
    return res.json();
  }
}
