import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { commandArgs, isAdmin, state } from "../moderation.js";

const composer = new Composer<Ctx>();
composer.command("setwelcome", async (ctx) => {
  if (!(await isAdmin(ctx))) { await ctx.reply("Only group admins can change the welcome message."); return; }
  const text = commandArgs(ctx);
  if (!text) { await ctx.reply("Add the welcome message after /setwelcome."); return; }
  state(ctx).welcomeText = text.slice(0, 1000); await ctx.reply("Welcome message updated.");
});
composer.command("setrules", async (ctx) => {
  if (!(await isAdmin(ctx))) { await ctx.reply("Only group admins can change spam rules."); return; }
  const action = commandArgs(ctx).toLowerCase();
  if (action !== "warn" && action !== "mute" && action !== "kick") { await ctx.reply("Choose an auto-action: /setrules warn, mute, or kick."); return; }
  state(ctx).rules.action = action; await ctx.reply(`Spam auto-action set to ${action}.`);
});
composer.command("stats", async (ctx) => {
  if (!(await isAdmin(ctx))) { await ctx.reply("Only group admins can view moderation stats."); return; }
  const s = state(ctx); const verified = s.memberIds.filter((id) => s.members[String(id)]?.verified).length;
  const removed = s.infractions.filter((x) => x.action === "remove" || x.action === "kick").length;
  await ctx.reply(`Verification report\nJoined: ${s.memberIds.length}\nVerified: ${verified}\nRemoved: ${removed}\nActions: ${s.infractions.length}`);
});
export default composer;
