// server/services/professionalStatusService.ts
import { db } from "@/db"; // adapte l'import à ton projet
import {
  professionalAccounts,
  verificationDocuments,
  // si besoin: users
} from "@/shared/schema";
import { eq, and, inArray } from "drizzle-orm";

export type ProStatus =
  | "pending_docs"
  | "under_review"
  | "verified"
  | "rejected";
export type DocType = "kbis" | "id_pdf" | "id_front" | "id_back" | "other";

/** Petit helper: vérifie la complétude de la CIN (pdf OU recto+verso) */
function hasCinComplete(docs: { documentType: DocType }[]): boolean {
  const hasPdf = docs.some((d) => d.documentType === "id_pdf");
  const hasFront = docs.some((d) => d.documentType === "id_front");
  const hasBack = docs.some((d) => d.documentType === "id_back");
  return hasPdf || (hasFront && hasBack);
}

/** Règles métier de statut à partir des données courantes */
function computeStatusFromData(params: {
  currentStatus?: ProStatus | null;
  isVerified?: boolean | null;
  verificationProcessStatus?:
    | "not_started"
    | "in_progress"
    | "completed"
    | null;
  hasKbis: boolean;
  hasCin: boolean;
}): ProStatus {
  const {
    currentStatus,
    isVerified,
    verificationProcessStatus,
    hasKbis,
    hasCin,
  } = params;

  // Décisions admin en priorité
  if (isVerified === true) return "verified";
  if (currentStatus === "rejected") return "rejected";

  // Complétude documentaire
  const complete = hasKbis && hasCin;
  if (complete) return "under_review";

  // Flux legacy (si quelqu’un utilisait encore verificationProcessStatus)
  if (
    verificationProcessStatus === "in_progress" ||
    verificationProcessStatus === "completed"
  ) {
    return complete ? "under_review" : "pending_docs";
  }

  return "pending_docs";
}

export class ProfessionalStatusService {
  /** Charge compte + documents (KBIS/CIN) */
  static async loadAccountWithDocs(professionalAccountId: number) {
    const [account] = await db
      .select()
      .from(professionalAccounts)
      .where(eq(professionalAccounts.id, professionalAccountId))
      .limit(1);

    if (!account) throw new Error("Professional account not found");

    const docs = await db
      .select({
        id: verificationDocuments.id,
        documentType: verificationDocuments.documentType,
        verificationStatus: verificationDocuments.verificationStatus,
        fileUrl: verificationDocuments.fileUrl,
        fileName: verificationDocuments.fileName,
      })
      .from(verificationDocuments)
      .where(
        eq(verificationDocuments.professionalAccountId, professionalAccountId),
      );

    return { account, docs };
  }

  /** Renvoie un statut unifié + flags utiles pour le front */
  static async getCompleteStatus(professionalAccountId: number) {
    const { account, docs } = await this.loadAccountWithDocs(
      professionalAccountId,
    );

    const hasKbis = docs.some((d) => d.documentType === "kbis");
    const hasCin = hasCinComplete(docs);

    const unifiedStatus = computeStatusFromData({
      currentStatus: account.status as ProStatus | null,
      isVerified: account.isVerified as boolean | null,
      verificationProcessStatus: account.verificationProcessStatus as any,
      hasKbis,
      hasCin,
    });

    // Flags front (exemple)
    const canPostPublic = unifiedStatus === "verified";
    const newListingsDefault = canPostPublic ? "approved" : "pending";

    return {
      status: unifiedStatus,
      canPostPublic,
      newListingsDefault, // "approved" | "pending"
      completeness: { hasKbis, hasCin },
      docs, // utile pour un écran “vos documents”
    };
  }

  /** À appeler après upload(s) de documents pour recalculer et sauver le statut */
  static async updateStatusAfterUpload(professionalAccountId: number) {
    const { account, docs } = await this.loadAccountWithDocs(
      professionalAccountId,
    );

    const hasKbis = docs.some((d) => d.documentType === "kbis");
    const hasCin = hasCinComplete(docs);

    const next = computeStatusFromData({
      currentStatus: account.status as ProStatus | null,
      isVerified: account.isVerified as boolean | null,
      verificationProcessStatus: account.verificationProcessStatus as any,
      hasKbis,
      hasCin,
    });

    // Mets à jour le nouveau champ canonique + garde legacy en cohérence
    await db
      .update(professionalAccounts)
      .set({
        status: next,
        verificationProcessStatus:
          next === "under_review"
            ? "in_progress"
            : next === "pending_docs"
              ? "not_started"
              : account.verificationProcessStatus, // garde tel quel sinon
        isVerified:
          next === "verified"
            ? true
            : next === "rejected"
              ? false
              : account.isVerified,
        updatedAt: new Date(),
      })
      .where(eq(professionalAccounts.id, professionalAccountId));

    return next;
  }

  /** Utilitaire: met “verified” / “rejected” (panel admin) */
  static async setAdminDecision(
    professionalAccountId: number,
    decision: "verified" | "rejected",
    notes?: string,
  ) {
    await db
      .update(professionalAccounts)
      .set({
        status: decision,
        isVerified: decision === "verified",
        verificationProcessStatus: "completed",
        verifiedAt: decision === "verified" ? new Date() : null,
        rejectedReason: decision === "rejected" ? notes || null : null,
        updatedAt: new Date(),
      })
      .where(eq(professionalAccounts.id, professionalAccountId));
  }
}
