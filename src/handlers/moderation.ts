import { Composer } from "grammy";
import type { Ctx } from "../bot.js";
import { inlineButton, inlineKeyboard } from "../toolkit/index.js";
import { day, isSpam, log, member, now, prune, state, upsertMember } from "../moderation.js";

const composer = new Composer<Ctx>();

async function removeExpired(ctx: Ctx): Promise<void> {
  if (!ctx.chat || ctx.chat.type === "private") return;
  const s = state(ctx); prune(s);
  for (const id of s.memberIds) {
    const m = member(s, id);
    if (m && !m.verified && now() - m.joinTime >= 3 * 60 * 1000) {
      try { await ctx.api.banChatMember(ctx.chat.id, id); log(s, id, "remove", 0, "verification timed out"); } catch { /* bot may lack permission */ }
    }
  }
}

/** A group is the safe alert destination: it reaches its admins without cold-DMing members. */
async function sendDailySummary(ctx: Ctx): Promise<void> {
  if (!ctx.chat || ctx.chat.type === "private") return;
  const s = state(ctx); const today = day();
  if (s.lastSummaryDay === today) return;
  s.lastSummaryDay = today;
  const verified = s.memberIds.filter((id) => s.members[String(id)]?.verified).length;
  const removed = s.infractions.filter((x) => x.action === "remove" || x.action === "kick").length;
  await ctx.reply(`Daily moderation summary\nJoined: ${s.memberIds.length}\nVerified: ${verified}\nRemoved: ${removed}\nActions: ${s.infractions.length}`);
}

composer.on("message:new_chat_members", async (ctx) => {
  const s = state(ctx); prune(s);
  for (const joined of ctx.message.new_chat_members) {
    if (joined.is_bot) continue;
    upsertMember(s, joined.id, { joinTime: now(), verified: false });
    try { await ctx.api.restrictChatMember(ctx.chat.id, joined.id, { can_send_messages: false }); } catch { /* bot may lack permission */ }
    await ctx.reply(s.welcomeText, { reply_markup: inlineKeyboard([[inlineButton("I’m human", "verify:human")]]) });
  }
});

composer.on("message:text", async (ctx, next) => {
  await removeExpired(ctx);
  await sendDailySummary(ctx);
  if (ctx.message.text.startsWith("/")) return next();
  if (ctx.chat.type === "private" || ctx.from.is_bot) return next();
  const s = state(ctx); const m = member(s, ctx.from.id);
  if (m && !m.verified) {
    try { await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id); } catch { /* permission issue */ }
    await ctx.reply("Verify with the button before posting."); return;
  }
  if (m?.trusted) return next();
  const reason = isSpam(ctx.message.text, s);
  if (!reason) return next();
  try { await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id); } catch { /* permission issue */ }
  const action = s.rules.action; log(s, ctx.from.id, action, 0, reason);
  try {
    if (action === "mute") await ctx.api.restrictChatMember(ctx.chat.id, ctx.from.id, { can_send_messages: false });
    if (action === "kick") await ctx.api.banChatMember(ctx.chat.id, ctx.from.id);
  } catch { /* action is still recorded when Telegram permission changed */ }
  await ctx.reply(`Spam action applied: ${action}. Reason: ${reason}.`);
});
export default composer;
