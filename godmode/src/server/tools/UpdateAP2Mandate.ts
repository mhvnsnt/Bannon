import { AP2Controller } from "../../lib/AP2Controller.js";

export const updateAP2Tool = {
  name: "UpdateAP2Mandate",
  description: "Updates the autonomous spend limits for God Mode OS.",
  parameters: {
    type: "object",
    properties: {
      dailyLimit: { type: "number" },
      txLimit: { type: "number" },
      alertThreshold: { type: "number" }
    }
  },
  execute: async (args: any) => {
    return await AP2Controller.updateMandate(args.dailyLimit, args.txLimit, args.alertThreshold);
  }
};
