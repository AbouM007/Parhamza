// client/src/components/CreateListingTrigger.tsx
import { ReactNode } from "react";
import { useCreateListingGuard } from "@/hooks/useCreateListingGuard";

type Variant = "button" | "link";

export default function CreateListingTrigger({
  origin = "unknown",
  variant = "button",
  className,
  children = "Déposer une annonce",
}: {
  origin?: string;
  variant?: Variant;
  className?: string;
  children?: ReactNode;
}) {
  const handle = useCreateListingGuard();

  if (variant === "link") {
    return (
      <a
        role="button"
        onClick={(e) => { e.preventDefault(); handle(origin); }}
        className={className || "text-sm font-medium underline cursor-pointer"}
        href="/liste/creer"
      >
        {children}
      </a>
    );
  }

  // variant === "button"
  return (
    <button
      type="button"
      onClick={() => handle(origin)}
      className={
        className ||
        "inline-flex items-center rounded-xl bg-black px-4 py-2 text-white hover:opacity-90"
      }
    >
      {children}
    </button>
  );
}
