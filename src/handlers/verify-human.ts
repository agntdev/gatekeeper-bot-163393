import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { log, member, now, state, upsertMember } from "../moderation.js";

const composer = new Composer<Ctx>();
composer.callbackQuery("verify:human", async (ctx) => {
  await ctx.answerCallbackQuery();
  const s = state(ctx); const userId = ctx.from.id; const m = member(s, userId);
  if (!m) { await ctx.reply("Your verification has expired. Ask an admin to add you again."); return; }
  if (now() - m.joinTime > 3 * 60 * 1000) { await ctx.reply("Your verification has expired. Ask an admin to add you again."); return; }
  upsertMember(s, userId, { verified: true }); log(s, userId, "verify", userId, "human verification");
  await ctx.editMessageText("You’re verified and can post in this group.", { reply_markup: inlineKeyboard([[inlineButton("Open dashboard", "menu:main")]]) });
});
export default composer;
