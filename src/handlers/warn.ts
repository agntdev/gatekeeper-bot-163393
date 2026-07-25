import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { commandArgs, isAdmin, log, state, targetFromReply, upsertMember } from "../moderation.js";

const composer = new Composer<Ctx>();
composer.command("warn", async (ctx) => {
  if (!(await isAdmin(ctx))) { await ctx.reply("Only group admins can issue warnings."); return; }
  const target = targetFromReply(ctx); const reason = commandArgs(ctx);
  if (!target || !reason) { await ctx.reply("Reply to a member with /warn and a short reason."); return; }
  upsertMember(state(ctx), target, {}); log(state(ctx), target, "warn", ctx.from?.id ?? 0, reason);
  await ctx.reply("Warning recorded.");
});
export default composer;
