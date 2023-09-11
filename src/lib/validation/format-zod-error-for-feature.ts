import { ZodError, ZodIssueCode } from 'zod';

/**
 * Formats a Zod error into a user-friendly string for a specific feature.
 *
 * @param error The Zod error.
 * @param featureName Name of the feature for which validation failed.
 * @returns The formatted error string.
 */
export function formatZodErrorForFeature(error: ZodError, featureName: string): string {
    let formattedMessage = `Invalid arguments for feature ${featureName}:\n`;

    for (const issue of error.issues) {
        const field = issue.path.join('.'); // Field that caused the error

        switch (issue.code) {
            case 'invalid_type':
                formattedMessage += `- Argument "${field}" is expected to be type ${issue.expected}, but type ${issue.received} provided.\n`;
                break;

            case 'invalid_union':
                formattedMessage += `- Argument "${field}" does not match any of the expected union types.\n`;
                break;

            case 'unrecognized_keys':
              if (issue.path.length === 0){
                for (const key of issue.keys) {
                  formattedMessage += `- Argument "${key}" is not recognized.\n`;
                }
              }else{
                formattedMessage += `- For argument "${field}", the following keys are not recognized: ${issue.keys.join(', ')}.`;
              }

            default:
                formattedMessage += `- Argument "${field}" is not valid: ${issue.message}\n`;
        }
    }

    return formattedMessage;
}