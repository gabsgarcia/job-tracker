// Shows the success / error message passed in the URL (?message=... or ?error=...).
export function Flash({
  message,
  error,
}: {
  message?: string;
  error?: string;
}) {
  if (!message && !error) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={
        error
          ? "rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          : "rounded-md border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200"
      }
    >
      {error ?? message}
    </div>
  );
}
