// conventional-changelog options for the release workflow's changelog step.
//
// Accepts all conventional commit prefixes (feat, fix, chore, refactor, etc.)
// in formats: "prefix(scope): message" or "prefix: message"
export default {
  types: [
    { type: "feat", section: "✨ Features", hidden: false },
    { type: "fix", section: "🐛 Bug Fixes", hidden: false },
    { type: "perf", section: "⚡ Performance Improvements", hidden: false },
    { type: "refactor", section: "♻️ Code Refactoring", hidden: false },
    { type: "chore", section: "🔧 Chores", hidden: false },
    { type: "style", section: "💅 Styling", hidden: true },
    { type: "test", section: "✅ Tests", hidden: true },
    { type: "docs", section: "📚 Documentation", hidden: true },
    { type: "ci", section: "⚙️ CI/CD", hidden: true },
  ],
};
