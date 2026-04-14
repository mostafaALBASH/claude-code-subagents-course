# What Are Subagents — Study Notes

## What Is a Subagent?

A subagent is a Claude instance spawned by a parent agent (the orchestrator) to handle a specific subtask. The parent delegates work via the `Agent` tool, waits for a result, and continues from there. From Claude's perspective as the subagent, it just receives a prompt and responds — it has no awareness that it's "inside" another agent.

The key mental model: **orchestrator → Agent tool call → subagent → result back to orchestrator**.

---

## How They Work

1. The orchestrator writes a self-contained prompt describing the task.
2. The `Agent` tool spawns a fresh Claude instance with that prompt.
3. The subagent has access to its own set of tools (defined by `subagent_type` or defaults).
4. The subagent runs to completion and returns a single message.
5. The orchestrator receives that message as the tool result and continues.

The subagent **cannot** send messages back mid-task or ask clarifying questions — it runs to completion and returns one result. This means the prompt handed to it must be fully self-contained.

---

## The Isolation Model

Subagents are isolated in two important ways:

### Context isolation
- A subagent starts with a **cold context** — it has no memory of the parent's conversation history.
- It only knows what the orchestrator explicitly puts in the prompt.
- This means you must re-derive and re-state everything the subagent needs: file paths, constraints, relevant background, the goal, and the expected output format.

### Tool isolation (with `worktree` mode)
- With `isolation: "worktree"`, the subagent operates on a **git worktree copy** of the repo.
- Changes are isolated from the main working directory.
- If the subagent makes no changes, the worktree is automatically cleaned up.
- If it does make changes, the branch/path is returned so the orchestrator can review and merge.

This isolation prevents subagents from accidentally interfering with each other when running in parallel.

---

## Subagent Types

Different subagent types have different tool sets and specializations:

| Type | Best for |
|---|---|
| `general-purpose` | Multi-step research, file edits, complex tasks |
| `Explore` | Read-only codebase exploration and search |
| `Plan` | Designing implementation strategies |
| `claude-code-guide` | Questions about Claude Code / API features |

When `subagent_type` is omitted, the general-purpose agent is used.

---

## When Subagents Are Useful

**Parallelism** — multiple independent tasks can run simultaneously by spawning multiple subagents in one message. Example: linting, testing, and building in parallel.

**Context protection** — large tool outputs (grep results, file trees, logs) would bloat the orchestrator's context. Delegating to a subagent keeps the main context clean.

**Specialization** — certain subagent types (Explore, Plan) are faster or cheaper for specific work.

**Worktree isolation** — when you need multiple agents editing code simultaneously without conflicts.

---

## When NOT to Use Subagents

- When the target file/symbol is already known — just use `Read`, `Grep`, or `Glob` directly.
- For simple, one-shot lookups — the cold-start overhead isn't worth it.
- When you need the result to inform your very next action and could get it just as easily yourself.
- When the task requires back-and-forth clarification — subagents can't ask questions mid-run.

---

## Writing Good Subagent Prompts

Since subagents start cold, the prompt must stand alone. Good prompts:

- State the **goal** clearly ("Find all API endpoints and list them with their HTTP methods").
- Include relevant **context** the subagent needs (file paths, constraints, background decisions).
- Describe what the **output** should look like ("Return a markdown table", "Report in under 200 words").
- State what the subagent should **not** do if there are important guardrails.
- Tell the agent whether to **write code** or just **research** — it won't infer this from tone.

Weak: "Based on your findings, fix the bug." (pushes synthesis onto the subagent)  
Strong: "Fix the null-check bug at src/auth.ts:42 — the `user` object can be undefined when the session expires. Add a guard before line 42 that returns a 401 response."

---

## Key Takeaway

Subagents are powerful for **parallelism** and **context management**, but they cost a cold-start and require fully self-contained prompts. Use them when the task is truly independent, when outputs would bloat context, or when you need worktree isolation. Handle everything else inline.
