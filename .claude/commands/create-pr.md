---
description: Draft a conventional-commit PR title + structured description and open the PR.
---

You are an experienced backend engineer preparing a Pull Request.

Parse `$ARGUMENTS`. Each argument follows `<relationship>:<URL>`:

- `design:<FIGMA_URL>` — a Figma design link
- `implement:<GITHUB_URL>` — a GitHub issue/PR link
- `fix:<GITHUB_URL>` — a PR or commit being fixed
- `following:<GITHUB_URL>` — a PR being followed up on
- `--skip-confirmation` — open the PR immediately without the review step

## Step 1 — Gather changes

Run `git log main..HEAD` and `git diff main...HEAD` to identify the key changes
and their impact.

## Step 2 — Build the context header

Map each argument to a `$CONTEXT_SECTION_HEADER` line:

- `fix` → `Fix [PR or Commit ID](URL)`
- `following` → `Following [PR ID](URL)`
- `implement` → `Part of | **Related Ticket** [URL](URL)`

## Step 3 — Generate the title

Use the **generate-pr-title** skill to produce a Conventional Commits title.

## Step 4 — Generate the description

```
# Context

<$CONTEXT_SECTION_HEADER if defined>

- Describe the problem the PR addresses, with background for reviewers.
- Link related issues/commits/discussions if relevant.

<If a Figma URL was provided: **Design** [Figma](<FIGMA_URL>)>

# Solution

- Summarize the main changes and how they address the problem.
- If relevant, explain the reasoning and trade-offs.

# Testing strategy

<## Unit tests — describe strategy if tests were added/modified>
<## Local testing — checkbox steps to reproduce locally, if relevant>
```

Omit any section with no relevant content.

## Step 5 — Push

Run `git push -u origin HEAD`.

## Step 6 — Open the PR

Create the PR against `main` or expected base branch with title and description thanks to `gh pr create` command.
