---
name: generate-pr-title
description: This skill generates a Pull Request title following the Conventional Commits specification.
---

# Instructions

Write a concise title in conventional commit format summarizing the main changes:

- Use one of: feat, fix, refactor, perf, test, docs, build, ci, chore
- Format: <type>(<scope>): <description>
- Use present tense
- Focus on the user-visible or architectural impact
- Scope is optional but preferred when obvious
- Do not add explanations, only output the PR title

# Available types

1. User-facing features → feat
2. Bug fixes → fix
3. Code structure improvements without behavior changes → refactor
4. Performance improvements → perf
5. Test additions/modifications → test
6. Documentation → docs
7. CI/CD changes → ci
8. Build tooling → build
9. Maintenance work → chore

# Examples

- refactor(domain): Centralize charge point state transitions
- ci(github): Add typecheck validation step
- docs(ai): Add backend architecture guidelines

# Output requirements

- Single line only
- Format: <type>(<scope>): <description>
- Lowercase type and scope
- Imperative mood
- Maximum 80 characters
- No markdown
- No quotes
