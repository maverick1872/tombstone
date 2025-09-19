export interface CollectedLog {
	args: unknown[];
}

export const logMessages: CollectedLog[] = [];
export const warnMessages: CollectedLog[] = [];
export const errorMessages: CollectedLog[] = [];

export const fakeLogger: Partial<Console> = {
	log: (...args: unknown[]) => logMessages.push({ args }),
	warn: (...args: unknown[]) => warnMessages.push({ args }),
	error: (...args: unknown[]) => errorMessages.push({ args }),
};

export function resetLogger() {
	logMessages.length = 0;
	warnMessages.length = 0;
	errorMessages.length = 0;
}
