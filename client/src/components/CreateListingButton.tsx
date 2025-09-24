// client/src/components/CreateListingButton.tsx
import { useCreateListingGuard } from "@/hooks/useCreateListingGuard";

export function CreateListingButton({
  origin = "unknown",
  children,
  className,
}: {
  origin?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const handle = useCreateListingGuard();
  return (
    <button type="button" className={className} onClick={() => handle(origin)}>
      {children}
    </button>
  );
}
