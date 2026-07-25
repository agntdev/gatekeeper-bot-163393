import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard, registerMainMenuItem } from "../toolkit/index.js";
import { isAdmin, state } from "../moderation.js";

registerMainMenuItem({ label: "Open dashboard", data: "guard:dashboard", order: 10 });
const composer = new Composer<Ctx>();
const keyboard = inlineKeyboard([[inlineButton("View stats", "guard:stats"), inlineButton("Set rules", "guard:rules")], [inlineButton("Set welcome", "guard:welcome")], [inlineButton("Back to menu", "menu:main")]]);
composer.callbackQuery("guard:dashboard", async (ctx) => {
  await ctx.answerCallbackQuery();
  if (!(await isAdmin(ctx))) { await ctx.editMessageText("This dashboard is available to group admins."); return; }
  await ctx.editMessageText("Manage verification, spam rules, and moderation reports.", { reply_markup: keyboard });
});
composer.callbackQuery("guard:stats", async (ctx) => {
  await ctx.answerCallbackQuery(); const s = state(ctx);
  const verified = s.memberIds.filter((id) => s.members[String(id)]?.verified).length;
  await ctx.editMessageText(`Members tracked: ${s.memberIds.length}\nVerified: ${verified}\nActions in the last 90 days: ${s.infractions.length}`, { reply_markup: keyboard });
});
composer.callbackQuery("guard:rules", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Reply with /setrules followed by warn, mute, or kick.", { reply_markup: keyboard }); });
composer.callbackQuery("guard:welcome", async (ctx) => { await ctx.answerCallbackQuery(); await ctx.editMessageText("Reply with /setwelcome followed by the welcome message.", { reply_markup: keyboard }); });
export default composer;
