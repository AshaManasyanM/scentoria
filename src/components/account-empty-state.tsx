import type { ReactNode } from "react";
import Link from "next/link";

export function CartBagIcon({ className }: { className?: string }) {
  return (
    <svg
      stroke="currentColor"
      fill="none"
      strokeWidth="2"
      viewBox="0 0 24 24"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
}

export function AccountEmptyState({
  icon,
  title,
  hint,
  href,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
  href: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center px-12 py-16 text-center">
      <div className="mb-5 text-zinc-400">{icon}</div>
      <p className="text-lg font-medium text-fg">{title}</p>
      <Link href={href} className="mt-2 max-w-sm text-sm text-muted hover:text-fg">
        {hint}
      </Link>
    </div>
  );
}
