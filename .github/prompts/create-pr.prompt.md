# Create PR

You are an experienced frontend software engineer.

Parse the arguments from `$ARGUMENTS`. Each argument follows the format `<relationship>:<URL>`:

- `design:<FIGMA_URL>` — a Figma design link
- `implement:<GITHUB_URL>` — a GitHub issue or pull request link
- `fix:<GITHUB_URL>` — a GitHub PR or commit being fixed
- `following:<GITHUB_URL>` — a GitHub PR being followed up on

## Step 1 — Gather changes

Run `git log main..HEAD` and `git diff main...HEAD` to identify the key changes and their impact on the codebase.

## Step 2 — Build the context header

Map each argument to a `$CONTEXT_SECTION_HEADER` line:

- `fix` + GitHub URL → `Fix [PR or Commit ID](URL)`
- `following` + GitHub URL → `Following [PR ID](URL)`
- `implement` + GitHub URL → `Part of | **Related Ticket** [URL](URL)`

## Step 3 — Generate the PR title

Use the `generate-pr-title` skill to create a concise title in conventional commit format summarizing the main changes.

Allowed prefixes include: `feat`, `fix`, `docs`, `refactor`, `perf`, `chore`.
A functional description tag should follow the prefix, surrounded by parentheses.
And a brief description should follow the tag, separated by a colon.

For example, "chore(ai): Update PR prompt" or "fix(ws): Fix Websocket event name".

## Step 4 — Generate the PR description using this template

```
# Context

<$CONTEXT_SECTION_HEADER if defined>

- Describe the problem or issue the PR addresses, with any relevant background for reviewers.
- Include links to related issues, commits, or discussions if relevant.

<If a Figma URL was provided: **Design** [Figma](<FIGMA_URL>)>

# Solution

- Summarize the main changes and explain how they address the problem.

:arrow_right: If relevant, explain the reasoning and any trade-offs considered.

# Testing strategy

<## Unit tests — if tests were added or modified, describe the testing strategy>

<## Local testing — if relevant, a checkbox list of steps to reproduce the changes locally>

| Before | After |
|--------|-------|
|        |       |
```

Omit any section that has no relevant content.

## Step 5 — Ensure the branch is pushed

Run `git push -u origin HEAD` before creating the PR. If the branch is already up to date, continue without error.

## Step 6 — Review before publishing

Display the generated title and description and ask: **"Does this look good? Reply 'yes' to create the PR or provide corrections."**

Only proceed to Step 7 once confirmed.

## Step 7 — Create the PR

Run `gh pr create --base main --title "<title>" --body "<description>"` to open the PR.
