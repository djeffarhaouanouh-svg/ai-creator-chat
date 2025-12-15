import { getAllCreatorsDB, getCreatorDBBySlug } from "./creators-db";
import { localCreators } from "./creators";

const isServer = typeof window === "undefined";

export async function getCreators() {
  let dbCreators: any[] = [];

  if (isServer) {
    try {
      const { getAllCreatorsDB } = await import("./creators-db");  // ← Import dynamique
      const result = await getAllCreatorsDB();
      if (Array.isArray(result)) dbCreators = result;
    } catch (err) {
      console.error("Erreur DB :", err);
    }
  }

  return localCreators.map(local => {
    const db = dbCreators.find((c: any) => c.slug === local.slug) || {};
    // Ne pas écraser les valeurs locales avec null/undefined de la DB
    const merged: any = { ...local };
    Object.keys(db).forEach(key => {
      if (db[key] != null) {
        merged[key] = db[key];
      }
    });
    return merged;
  });
}

export async function getCreatorBySlug(slug: string) {
  let db: any = null;

  if (isServer) {
    try {
      const { getCreatorDBBySlug } = await import("./creators-db");  // ← Import dynamique
      db = await getCreatorDBBySlug(slug);
    } catch (err) {
      console.error("Erreur DB :", err);
    }
  }

  const local = localCreators.find(c => c.slug === slug) || {};
  // Ne pas écraser les valeurs locales avec null/undefined de la DB
  const merged: any = { ...local };
  if (db) {
    Object.keys(db).forEach(key => {
      if (db[key] != null) {
        merged[key] = db[key];
      }
    });
  }
  return merged;
}
