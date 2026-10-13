/** The text a form field was submitted with, or an empty string if it is absent or a file. */
export function readField(form: FormData, name: string): string {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
