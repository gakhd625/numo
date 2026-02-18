/**
 * Get a user-friendly error message from any error (Supabase, Error, or plain object).
 * Use this so errors are always shown in Alerts without relying on console logs.
 */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error == null) return fallback;
  if (typeof error === 'string') return error || fallback;
  // Supabase / Postgrest error shape
  if (error?.message) return error.message;
  if (error?.error_description) return error.error_description;
  if (error?.details) return error.details;
  if (error?.hint) return error.hint;
  if (error?.code) return `Error (${error.code}): ${error.message || fallback}`;
  try {
    const str = typeof error.toString === 'function' ? error.toString() : String(error);
    if (str && str !== '[object Object]') return str;
  } catch (_) {}
  try {
    return JSON.stringify(error).slice(0, 200) || fallback;
  } catch (_) {
    return fallback;
  }
}
