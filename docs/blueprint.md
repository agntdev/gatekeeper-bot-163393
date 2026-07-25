# GroupGuard — Bot specification

**Archetype:** community

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

Telegram group moderation bot with automated anti-spam, single-tap human verification, admin commands, and metrics tracking. Enforces rules through verification buttons, spam detection thresholds, and configurable auto-actions while maintaining audit logs and admin alerts.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Telegram group owners
- Community moderators

## Success criteria

- 90%+ new members verified within 3 minutes
- 85%+ spam messages blocked before posting
- Admins receive daily summary reports with action metrics

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open moderation dashboard for admins or verification interface for new users
- **/warn** (command, actor: admin, command: /warn) — Issue warning to user with reason
- **/trust** (command, actor: admin, command: /trust) — Mark user as trusted (exempt from auto-actions)
- **I'm human** (button, actor: user, callback: verify:human) — Complete verification to enable posting

## Flows

### Join verification
_Trigger:_ user_join

1. Post welcome message with verification button
2. Enforce message deletion from unverified users
3. Remove user if verification timeout exceeded

_Data touched:_ Member, Verification session

### Spam detection
_Trigger:_ message_posted

1. Check message against spam thresholds
2. Apply configured auto-action (warn/mute/kick)
3. Log infraction with reason

_Data touched:_ Infraction record

### Admin moderation
_Trigger:_ /command

1. Execute admin command
2. Confirm action with brief response
3. Log action in audit trail

_Data touched:_ Infraction record, Admin settings

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Member** _(retention: persistent)_ — Group participant with verification status and trust level
  - fields: user_id, join_time, verified, trusted
- **Verification session** _(retention: session)_ — Time-limited verification state for new users
  - fields: user_id, start_time, timeout
- **Infraction record** _(retention: persistent)_ — Logged moderation actions and reasons
  - fields: user_id, action_type, timestamp, actor, reason
- **Admin settings** _(retention: persistent)_ — Configurable moderation rules and thresholds
  - fields: welcome_text, spam_thresholds, trusted_users

## Integrations

- **Telegram** (required) — Bot API messaging and group moderation
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- /setwelcome
- /setrules
- /trust
- /untrust
- /stats

## Notifications

- Daily admin summary with join/verification/removal metrics
- Real-time alerts for kicks/bans

## Permissions & privacy

- Only stores essential moderation data (no private messages)
- User data retained for 90 days by default

## Edge cases

- Users abandoning verification mid-flow
- Spam messages matching legitimate patterns
- Admin commands targeting other admins

## Required tests

- End-to-end verification flow with timeout handling
- Spam detection accuracy with edge cases
- Admin command execution with proper permissions

## Assumptions

- Default 3-minute verification timeout is acceptable for most groups
- Trusted users list starts empty
- Auto-action thresholds can be tuned post-deployment
