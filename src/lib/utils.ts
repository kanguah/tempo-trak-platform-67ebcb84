import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Replaces template variables in a string with values from an object.
 * Template variables are wrapped in double curly braces: {{variableName}}
 * 
 * @param template - The template string containing {{placeholder}} variables
 * @param variables - Object containing key-value pairs for replacement
 * @returns The rendered string with placeholders replaced by their values
 * 
 * @example
 * const template = "Dear {{name}}, your payment of {{amount}} is due on {{date}}.";
 * const variables = { name: "Kwame", amount: "GHS 300", date: "15th December 2025" };
 * const result = replaceTemplateVariables(template, variables);
 * // Returns: "Dear Kwame, your payment of GHS 300 is due on 15th December 2025."
 */
export function replaceTemplateVariables(
  template: string,
  variables: Record<string, string | number>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    // If the key exists in variables, return its value, otherwise keep the placeholder
    return key in variables ? String(variables[key]) : match;
  });
}
