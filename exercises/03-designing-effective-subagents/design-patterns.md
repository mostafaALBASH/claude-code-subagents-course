# Design Patterns Applied Across My Three Subagents

Study notes on four patterns I used when building `code-quality-reviewer`, `codebase-researcher`, and `copywriter`.

---

## Pattern 1: Specific Descriptions That Shape Input Prompts

The `description` field is not just a label - it is read by the orchestrating model to decide when and how to invoke the agent. A vague description produces vague invocations. A specific one tells the caller exactly what to pass in.

**code-quality-reviewer** uses worked examples in the description:

```
<example>
Context: The user has just implemented a new authentication endpoint.
user: "I just finished writing the login endpoint with JWT token generation"
assistant: "Great, let me launch the code quality reviewer to examine your recent changes."
<commentary>
Since the user just wrote new code for an authentication feature, use the Agent tool
to launch the code-quality-reviewer to check for security vulnerabilities...
</commentary>
</example>
```

The examples show the trigger (user announces a finished chunk of work), the phrasing the assistant should use, and the reasoning behind invoking the agent. This pattern-matches the Claude few-shot prompting approach applied at the meta level - training the orchestrator's behavior, not the agent's.

**codebase-researcher** takes a different approach, using a direct instruction in the description:

> "You must tell the agent precisely what to investigate and what question to answer."

This shifts responsibility to the caller. Instead of examples showing what to say, it states a requirement - the agent will only work well if it receives a specific question and a specific target.

**copywriter** does the same:

> "You must tell the agent the audience, tone, and purpose of the text."

Three required inputs are named explicitly. Any invocation missing one of those three will produce weaker output.

**Takeaway**: Descriptions should either show by example (reviewer) or state requirements explicitly (researcher, copywriter). Both approaches constrain how the orchestrator writes its prompt.

---

## Pattern 2: Structured Output Format

All three agents define a fixed output structure. This makes the agent's return value predictable and composable - the orchestrator can extract sections, summarize them, or pass them downstream without parsing freeform prose.

**code-quality-reviewer** defines seven numbered sections in its system prompt:

```
1. Summary
2. Critical Issues
3. Major Issues
4. Minor Issues
5. Recommendations
6. Obstacles Encountered
7. Approval Status
```

**codebase-researcher** defines four sections with markdown headings:

```
### Answer
### Evidence
### Call Chain (if applicable)
### Gaps
```

**copywriter** defines three sections:

```
### Draft
### Rationale
### Alternatives
```

The structure is matched to the agent's purpose. The reviewer has seven sections because a code review has many distinct concerns. The researcher has four because research produces a finding, its evidence, its trace, and its unknowns. The copywriter has three because writing output needs the text itself plus enough context for the caller to evaluate it.

**Takeaway**: Define output sections in terms of what the caller needs to act on, not what feels complete from the agent's perspective.

---

## Pattern 3: Obstacle and Gap Reporting

Agents that hit dead ends should say so explicitly rather than silently skipping over gaps or returning partial answers without explanation. All three agents have a dedicated section for this.

**code-quality-reviewer** has `6. Obstacles Encountered`:

> "Any setup issues, workarounds discovered, commands that needed special flags, or dependencies that caused problems"

This is operational - it captures friction in the review process itself (e.g., a git diff that returned nothing, a missing test file, an unfamiliar framework). The agent is also instructed inline:

> "If `git diff` returns nothing (no recent changes), inform the user and ask them to specify which files or commits to review."
> "If you encounter unfamiliar frameworks or languages, apply general software engineering principles and note your uncertainty explicitly."

**codebase-researcher** has `### Gaps`:

> "Anything you could NOT determine and why (e.g., 'Could not find where X is configured - it may be set via environment variable')"

The example is precise: it names a specific class of gap (environment variable configuration that has no source-code trace) and shows the phrasing. The researcher cannot run code or inspect runtime state, so gaps are expected and should be surfaced cleanly.

**copywriter** surfaces this more implicitly through `### Rationale` - the writer explains why choices were made, which naturally exposes assumptions and trade-offs rather than hiding them.

**Takeaway**: Agents should never go silent when they hit limits. A named output section for gaps/obstacles normalizes reporting unknowns as part of the job.

---

## Pattern 4: Limited Tool Access

Each agent receives only the tools it needs. This is a safety and focus decision: fewer tools means fewer ways to go wrong, and the tool list itself signals the agent's role.

**code-quality-reviewer** has the broadest access:

```
tools: Bash, Glob, Grep, Read, WebFetch, WebSearch, mcp__ide__executeCode, ...
```

It needs Bash to run `git diff`. It needs `mcp__ide__getDiagnostics` to check for language server errors. The broad access reflects that reviewing code requires active investigation - running commands, not just reading files. The constraint is applied at the behavioral level instead: `"You MUST NOT edit, modify, or write to any files."` This is enforced by instruction rather than by removing write tools.

**codebase-researcher** has strict tool restriction at the infrastructure level:

```
tools: Glob, Grep, Read
```

No Bash, no web access, no execution. Three tools that together cover find-by-name, find-by-content, and read-content. The system prompt reinforces it: `"You are READ-ONLY. You cannot edit files, run commands, or execute code."` Here the tool list and the instruction agree - belt and suspenders.

**copywriter** has the same three tools:

```
tools: Glob, Grep, Read
```

The copywriter needs to read existing content to match tone and terminology, but has no reason to search the web or run commands. The system prompt adds a behavioral constraint that the tool list cannot enforce: `"You are NOT a code assistant. Do NOT write code, suggest code changes, or think like an engineer."` This guards against role drift - a model with read access to source files might be tempted to give code suggestions without the instruction explicitly forbidding it.

**Takeaway**: Start with the minimum tool set the agent needs to do its job. When a constraint cannot be enforced by withholding tools (e.g., "don't suggest code changes"), enforce it by instruction. Use both when the risk is high.

---

## Summary Table

| Pattern | code-quality-reviewer | codebase-researcher | copywriter |
|---|---|---|---|
| Description shaping | Three worked `<example>` blocks | Explicit caller requirement ("you must tell the agent precisely...") | Three named required inputs |
| Output structure | 7 numbered sections | 4 markdown headings | 3 markdown headings |
| Gap/obstacle reporting | `Obstacles Encountered` section + inline edge case instructions | `Gaps` section with example phrasing | Implicit via `Rationale` |
| Tool restriction | Broad tools + behavioral write prohibition | Glob/Grep/Read only (infrastructure + instruction) | Glob/Grep/Read only + behavioral role prohibition |
