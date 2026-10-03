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

      // /character — guided character-design dialogue. The owner drives model generation; this lets
      // the bot ASK HIM for the details it needs (ethnicity/skin tone, gimmick, fighting style,
      // attire, moveset, finisher) per the binding CHARACTER GENERATION RULES, then turns his answers
      // into a clean image->3D gen prompt. Routes through the (now local-first) no-limit model.
      this.bot.command("character", async (ctx) => {
        const name = ctx.message.text.replace(/^\/character\b/i, "").trim();
        const framing = [
          "You are BANNON's character designer. The OWNER is generating a wrestler model and needs help.",
          "RULES (binding): (1) NO trademarked logos — invent proprietary Bannon-universe marks instead;",
          "(2) coherent pro-wrestling attire only — no nonsense straps/suspenders/floating gear;",
          "(3) ethnicity is identity — always set race + skin tone, keep the roster diverse;",
          "(4) semi-realistic sim-game likeness matching the gimmick/style/psychology; (5) clean A-pose seed.",
          name ? `The character is: "${name}".` : "The owner did not name a character yet.",
          "Ask him SHORT, specific clarifying questions for anything missing (ethnicity/skin tone, body",
          "type, gimmick, fighting style, hair, attire layers, finisher). When you have enough, output a",
          "single tight image->3D generation prompt in the gen_prompts.json _style format. Be concise.",
        ].join(" ");
        await ctx.reply(`[Character Designer] Let's build ${name || "a new fighter"}. Working…`);
        try {
          const response = await modelRouter.route({
            prompt: framing,
            taskType: "CHAT",
            context: { source: "telegram_character", user: ctx.message.from.username || "unknown" },
            taskId: "tgchar_" + Date.now(),
          });
          await ctx.reply(response && response.length ? response.substring(0, 4000) : "[Designer] No response from the local model — is the Ollama node online?");
        } catch (e: any) {
          await ctx.reply(`[Designer] Failed: ${e.message}`);
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
