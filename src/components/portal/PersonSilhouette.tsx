export function PersonSilhouette({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 100 100" aria-hidden>
      <circle cx="50" cy="40" r="20" fill="currentColor" />
      <path d="M12 100c0-24 17-38 38-38s38 14 38 38Z" fill="currentColor" />
    </svg>
  );
}
