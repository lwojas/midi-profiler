import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // prober/ is a separate, self-contained companion app with its own
    // package.json and its own `npm test` (see docs/device-prober.md) --
    // without this, vitest's default glob would also pick up its test
    // files from here, coupling the two packages' test runs together.
    exclude: ["**/node_modules/**", "prober/**"],
  },
});
