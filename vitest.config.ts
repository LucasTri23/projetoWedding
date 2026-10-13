import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: process.env.FIRESTORE_EMULATOR_HOST
      ? ["tests/**/*.test.ts"]
      : [
          "tests/business.test.ts",
          "tests/deployment.test.ts",
          "tests/calendar.test.ts",
        ],
    environment: "node",
    testTimeout: 15000,
    hookTimeout: 30000,
  },
});
