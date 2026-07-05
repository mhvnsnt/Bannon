import { Telegraf } from "telegraf";
import { modelRouter } from "./modelRouter";

export class TelegramAgent {
  private bot: Telegraf | null = null;
  private token: string;

  constructor() {
    this.token =
      process.env.TELEGRAM_BOT_TOKEN ||
      "8620527829:AAF2wpxQAGCaaHdtFYqoyYVkTF5c0JfEHA0";
  }

  public init() {
    if (!this.token) {
      console.error("[TelegramAgent] No token found.");
      return;
    }

    try {
      this.bot = new Telegraf(this.token);

      this.bot.start((ctx) => {
        ctx.reply("God Mode NexusMind Online. I am connected and ready.");
      });

      this.bot.help((ctx) =>
        ctx.reply("Send me a message and the God Mode Swarm will process it."),
      );

      this.bot.command("status", async (ctx) => {
        const stats = {
          node: "God Mode OS (NexusMind)",
          uptime: process.uptime(),
          memory: process.memoryUsage().rss / 1024 / 1024 + " MB",
          cpu_load: require("os").loadavg()[0],
        };
        await ctx.reply(
          `[STATUS REPORT]\nNode: ${stats.node}\nUptime: ${Math.floor(stats.uptime)}s\nMemory: ${stats.memory}\nLoad (1m): ${stats.cpu_load}`,
        );
      });

      this.bot.command("evolve", async (ctx) => {
        await ctx.reply("[SYSTEM] Initiating Darwinian Optimization Cycle...");
        try {
          const { CoreDarwinianModifier } = await import("./darwinianModifier");
          const modifier = new CoreDarwinianModifier();
          await modifier.executeEvolutionaryCycle({
            source: "telegram_trigger",
          });
          await ctx.reply(
            "[SYSTEM] Evolutionary Cycle Completed. Trunk optimized.",
          );
        } catch (e: any) {
          await ctx.reply(`[ERROR] Evolution failed: ${e.message}`);
        }
      });

      this.bot.on("text", async (ctx) => {
        const userInput = ctx.message.text;

        // Notify user we are processing
        await ctx.reply("Processing through NexusMind Swarm...");

        try {
          const response = await modelRouter.route({
            prompt: userInput,
            taskType: "CHAT",
            context: {
              source: "telegram_bot",
              user: ctx.message.from.username || "unknown",
            },
            taskId: "tg_" + Date.now(),
          });

          if (response && response.length > 0) {
            // Split long responses if needed
            if (response.length > 4000) {
              await ctx.reply(response.substring(0, 4000));
              await ctx.reply(response.substring(4000, 8000));
            } else {
              await ctx.reply(response);
            }
          } else {
            await ctx.reply(
              "[NexusMind] Error: Null or empty response from Swarm.",
            );
          }
        } catch (error: any) {
          console.error("[TelegramAgent] Routing Error:", error);
          await ctx.reply(
            `[System Error] Failed to process via NexusMind: ${error.message}`,
          );
        }
      });

      this.bot.launch().catch((err) => { console.error("[TelegramAgent] Bot failed to launch safely:", err.message); });
      console.log(
        `[TelegramAgent] Bot online and polling for token ${this.token.substring(0, 10)}...`,
      );

      // Enable graceful stop
      process.once("SIGINT", () => this.bot?.stop("SIGINT"));
      process.once("SIGTERM", () => this.bot?.stop("SIGTERM"));
    } catch (err) {
      console.error("[TelegramAgent] Failed to start:", err);
    }
  }
}

export const telegramAgent = new TelegramAgent();
