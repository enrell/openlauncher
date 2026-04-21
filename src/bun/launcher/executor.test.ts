import { describe, expect, test } from "bun:test";
import { executeCommand } from "./executor";

describe("executeCommand", () => {
	test("runs a local command and reports a successful exit code", async () => {
		const result = await executeCommand({ command: ["true"] });

		expect(result.success).toBe(true);
		expect(result.exitCode).toBe(0);
		expect(result.command).toEqual(["true"]);
		expect(result.durationMs).toBeGreaterThanOrEqual(0);
	});

	test("reports non-zero exit codes from local commands", async () => {
		const result = await executeCommand({ command: ["false"] });

		expect(result.success).toBe(false);
		expect(result.exitCode).toBe(1);
		expect(result.command).toEqual(["false"]);
	});

	test("passes custom environment variables to spawned commands", async () => {
		const result = await executeCommand({
			command: [
				process.execPath,
				"-e",
				"process.exit(process.env.OPENLAUNCHER_EXECUTOR_TEST === 'yes' ? 0 : 7)",
			],
			env: { OPENLAUNCHER_EXECUTOR_TEST: "yes" },
		});

		expect(result.success).toBe(true);
		expect(result.exitCode).toBe(0);
	});

	test("returns an error result when spawning fails", async () => {
		const command = ["/definitely/not/openlauncher-missing-command"];
		const result = await executeCommand({ command });

		expect(result.success).toBe(false);
		expect(result.exitCode).toBeNull();
		expect(result.command).toEqual(command);
		expect(result.error).toContain("openlauncher-missing-command");
	});
});
