import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface AdSlotConfig {
  position: "banner_top" | "banner_sidebar" | "inline_article" | "modal_promo";
  creativeUrl: string;
  alt?: string;
  weight?: number;
  linkUrl?: string;
  active?: boolean;
}

interface AdsFileSchema {
  updatedAt: string;
  items: AdSlotConfig[];
}

const ADS_PATH = join(process.cwd(), "content", "ads.json");

export async function readAds(): Promise<AdsFileSchema> {
  try {
    const data = await readFile(ADS_PATH, "utf8");
    return JSON.parse(data) as AdsFileSchema;
  } catch {
    return { updatedAt: new Date().toISOString(), items: [] };
  }
}

export async function writeAds(items: AdSlotConfig[]): Promise<void> {
  const payload: AdsFileSchema = {
    updatedAt: new Date().toISOString(),
    items,
  };
  await writeFile(ADS_PATH, JSON.stringify(payload, null, 2), "utf8");
}
