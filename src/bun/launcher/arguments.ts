export function splitLaunchArguments(args: string | undefined): string[] {
	const source = args?.trim();
	if (!source) {
		return [];
	}

	const parsedArguments: string[] = [];
	let currentArgument = "";
	let activeQuote: '"' | "'" | null = null;
	let escaping = false;

	for (const character of source) {
		if (escaping) {
			currentArgument += character;
			escaping = false;
			continue;
		}

		if (character === "\\") {
			escaping = true;
			continue;
		}

		if (activeQuote) {
			if (character === activeQuote) {
				activeQuote = null;
			} else {
				currentArgument += character;
			}
			continue;
		}

		if (character === '"' || character === "'") {
			activeQuote = character;
			continue;
		}

		if (/\s/.test(character)) {
			pushArgument(parsedArguments, currentArgument);
			currentArgument = "";
			continue;
		}

		currentArgument += character;
	}

	if (escaping) {
		currentArgument += "\\";
	}

	pushArgument(parsedArguments, currentArgument);
	return parsedArguments;
}

function pushArgument(
	parsedArguments: string[],
	currentArgument: string,
): void {
	if (currentArgument) {
		parsedArguments.push(currentArgument);
	}
}
