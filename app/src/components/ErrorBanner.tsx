export function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-2">
      <p className="text-sm text-red-800">{message}</p>
      <button onClick={onRetry} className="text-sm font-medium text-red-800 underline">
        Try again
      </button>
    </div>
  )
}
