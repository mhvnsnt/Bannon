import express from 'express';

export class DaemonCore {
  public router: express.Router;

  constructor() {
    console.log("[Node 12] Daemon Core Initialized");
    this.router = express.Router();
    this.setupRoutes();
  }

  private setupRoutes() {
    // FBX Upload POST route will be injected here
  }
}
