import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { commandArgs, isAdmin, log, state, targetFromReply, upsertMember } from "../moderation.js";

const composer = new Composer<Ctx>();
async function setTrust(ctx: Ctx, trusted: boolean) {
  if (!(await isAdmin(ctx))) { await ctx.reply("Only group admins can change trust settings."); return; }
  const target = targetFromReply(ctx);
  if (!target) { await ctx.reply(`Reply to a member with /${trusted ? "trust" : "untrust"}.`); return; }
  upsertMember(state(ctx), target, { trusted }); log(state(ctx), target, trusted ? "verify" : "warn", ctx.from?.id ?? 0, trusted ? "trusted" : "trust removed");
  await ctx.reply(trusted ? "Member is trusted and exempt from automatic actions." : "Member is no longer trusted.");
}
composer.command("trust", (ctx) => setTrust(ctx, true));
composer.command("untrust", (ctx) => setTrust(ctx, false));
export default composer;
