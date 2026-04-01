---
mode: ask
model: gpt-5
description: Draft pull request description for OCPP Supervisor
---

You are writing a pull request description for an OCPP Supervisor project.

Repository context:

- This is the frontend for an OCPP Supervisor.
- It's communicating with backend via WebSocket.
- For charge point management and state, never mix connection, synchronization, and charge point business status.

Task:
Write a pull request description using EXACTLY this format:

## Context

- Summarize behavioral changes
- Mention previous affected changes if relevant
- Mention if this is a follow-up or fix from a previous pull request

## Solution

- Describe the solution implemented with technical changes

## Testing

- List automated tests added or updated
- List manual scenarios tested
- Mention missing coverage if relevant

## Breaking changes

- State "None" if no breaking change

Rules:

- Be concise but precise
- Prefer system behavior over file-level description
- Avoid vague wording
- Optimize for reviewer clarity
