import { getAllCreatorsDB, getCreatorDBBySlug } from "./creators-db";
import { localCreators } from "./creators";

// Détection serveur
const isServer = typeof window === "undefined";

// Fusion pour TOUTES les créatrices
export async function getCreators() {
  let dbCreators: any[] = [];

  if (isServer) {
    try {
      const result = await getAllCreatorsDB();
      if (Array.isArray(result)) dbCreators = result;
    } catch (err) {
      console.error("Erreur DB :", err);
    }
  }

  return localCreators.map(local => {
    const db = dbCreators.find((c: any) => c.slug === local.slug) || {};
    return { ...local, ...db };
  });
}

// Fusion pour UNE seule créatrice
export async function getCreatorBySlug(slug: string) {
  let db: any = null;

  if (isServer) {
    try {
      db = await getCreatorDBBySlug(slug);
    } catch (err) {
      console.error("Erreur DB :", err);
    }
  }

  const local = localCreators.find(c => c.slug === slug) || {};

  return { ...local, ...(db || {}) };
}
