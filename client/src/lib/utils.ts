import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Retourne le nom d'affichage public d'un utilisateur
 * - Pour les professionnels : company_name uniquement (nom de l'entreprise)
 * - Pour les particuliers : display_name (pseudo) ou name (nom réel)
 * - Fallback : "Utilisateur"
 */
export function getUserDisplayName(user?: {
  type?: string | null;
  displayName?: string | null;
  display_name?: string | null;
  name?: string | null;
  companyName?: string | null;
  company_name?: string | null;
} | null): string {
  if (!user) return "Utilisateur";

  // Pour les professionnels : afficher UNIQUEMENT le nom de l'entreprise
  if (user.type === "professional") {
    return user.companyName || user.company_name || "Entreprise";
  }

  // Pour les particuliers : afficher le pseudo (display_name) si disponible, sinon le nom réel
  return user.displayName || user.display_name || user.name || "Utilisateur";
}
