import { vi } from "vitest";

// Only captureException is used by the app; loading the real SDK costs ~0.3s per test file.
vi.mock("@sentry/nextjs", () => ({ captureException: vi.fn() }));
