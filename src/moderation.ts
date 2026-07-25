import type { Ctx } from "./bot.js";

export type Action = "warn" | "mute" | "kick";
export interface Member { userId: number; joinTime: number; verified: boolean; trusted: boolean; }
export interface Infraction { userId: number; action: Action | "remove" | "verify"; timestamp: number; actor: number; reason: string; }
export interface GroupState {
  welcomeText: string;
  rules: { linkLimit: number; repeatLimit: number; action: Action };
  members: Record<string, Member>;
  memberIds: number[];
  infractions: Infraction[];
  adminIds: number[];
  lastSummaryDay?: string;
}

let clock: () => number = () => Date.now();
export const now = () => clock();
/** Test seam for time-based moderation; production never overrides it. */
export function setClockForTests(fn?: () => number): void { clock = fn ?? (() => Date.now()); }

export function state(ctx: Ctx): GroupState {
  return (ctx.session.groupGuard ??= {
    welcomeText: "Welcome. Tap I’m human within 3 minutes to start posting.",
    rules: { linkLimit: 2, repeatLimit: 12, action: "mute" },
    members: {}, memberIds: [], infractions: [], adminIds: [],
  });
}
export function prune(s: GroupState): void {
  const cutoff = now() - 90 * 24 * 60 * 60 * 1000;
  s.infractions = s.infractions.filter((x) => x.timestamp >= cutoff);
  for (const id of s.memberIds.filter((id) => s.members[String(id)]?.joinTime < cutoff)) delete s.members[String(id)];
  s.memberIds = s.memberIds.filter((id) => Boolean(s.members[String(id)]));
}
export function member(s: GroupState, userId: number): Member | undefined { return s.members[String(userId)]; }
export function upsertMember(s: GroupState, userId: number, values: Partial<Member>): Member {
  const key = String(userId); const existing = s.members[key];
  const next = { userId, joinTime: existing?.joinTime ?? now(), verified: existing?.verified ?? false, trusted: existing?.trusted ?? false, ...values };
  s.members[key] = next; if (!s.memberIds.includes(userId)) s.memberIds.push(userId); return next;
}
export function log(s: GroupState, userId: number, action: Infraction["action"], actor: number, reason: string): void {
  s.infractions.push({ userId, action, actor, reason, timestamp: now() });
}
export function commandArgs(ctx: Ctx): string { return ctx.message?.text?.replace(/^\/\w+(?:@\w+)?\s*/, "").trim() ?? ""; }
export function targetFromReply(ctx: Ctx): number | undefined { return ctx.message?.reply_to_message?.from?.id; }
export async function isAdmin(ctx: Ctx): Promise<boolean> {
  if (!ctx.chat || !ctx.from || ctx.chat.type === "private") return false;
  try {
    const m = await ctx.api.getChatMember(ctx.chat.id, ctx.from.id);
    return m.status === "creator" || m.status === "administrator";
  } catch { return false; }
}
export function isSpam(text: string, s: GroupState): string | undefined {
  const links = (text.match(/(?:https?:\/\/|www\.)\S+/gi) ?? []).length;
  if (links > s.rules.linkLimit) return "too many links";
  if (/(.)\1{11,}/i.test(text)) return "repeated characters";
  const letters = text.match(/[A-Za-z]/g) ?? [];
  const caps = text.match(/[A-Z]/g) ?? [];
  if (letters.length >= 12 && caps.length / letters.length > 0.85) return "excessive capitals";
  return undefined;
}
export function day(): string { return new Date(now()).toISOString().slice(0, 10); }
