// Supabase auth errors (e.g. "Invalid login credentials") are already
// written for end users — safe to show as-is. Everything else that
// reaches here is a raw JS/network exception (e.g. "UnknownHostException",
// "Network request failed") and must never be shown verbatim.
const TECHNICAL_ERROR_PATTERN = /exception|failed to fetch|network request failed|unable to resolve host|fetch failed|errno|econnrefused|timed? ?out/i

export function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? '')
  if (!message || TECHNICAL_ERROR_PATTERN.test(message)) {
    return "Couldn't connect. Check your internet connection and try again."
  }
  return message
}
