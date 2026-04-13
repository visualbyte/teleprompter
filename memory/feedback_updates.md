---
name: Commit sequence — only on explicit request
description: Only update docs and commit when user says "commit". Do not touch CLAUDE.md or memory outside this sequence unless specifically asked.
type: feedback
originSessionId: ddc1d091-3734-4559-9d03-694d73a071f4
---
When the user says "commit", follow this exact sequence:
1. Update memory files
2. Update CLAUDE.md and any other relevant instruction files
3. Run git commit
4. Push to GitHub (`git push origin main`)

When the user says "update memory and CLAUDE.md" (without mentioning commit or push): do steps 1–2 only. No git operations at all.

**Why:** Committing automatically is a security risk (could include secrets) and a blunder risk (could lock in broken code). Updating CLAUDE.md mid-task is noise and can introduce unreviewed instruction changes.

**How to apply:** After completing a code change, stop. Do not touch CLAUDE.md, do not touch memory, do not touch git. Wait for the user to say "commit". Only then run the full sequence. If user explicitly asks to update docs but says "don't push" or "keep local", do docs only — no git at all.
