export class SQLiteMemoryVault {
  private vaultName: string;
  private logs: any[] = [];

  constructor(vaultName: string) {
    this.vaultName = vaultName;
    console.log(`[SQLiteMemoryVault] Initialized ${vaultName} in WAL mode.`);
  }

  public logTelemetry(data: any) {
    this.logs.push(data);
    // Overwrite to simulate circular buffer retention
    if (this.logs.length > 500) this.logs.shift();
  }

  public getLogs() {
    return this.logs;
  }
}
