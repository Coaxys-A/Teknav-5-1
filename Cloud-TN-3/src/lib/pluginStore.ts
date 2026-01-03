import fs from "node:fs";
import path from "node:path";

export type StoredPlugin = {
  key: string;
  name: string;
  slot: string;
  type: string;
  description?: string;
  isEnabled: boolean;
  config?: any;
  category?: string;
};

const storePath = path.join(process.cwd(), "data", "plugins.json");

function ensureFile() {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(storePath)) {
    const seed: StoredPlugin[] = [
      {
        key: "hero-banner",
        name: "بنر هدر",
        slot: "homepage_hero",
        type: "banner",
        description: "نمایش بنر بالای صفحه اصلی",
        isEnabled: true,
        config: { cta: "/join" },
        category: "ui",
      },
    ];
    fs.writeFileSync(storePath, JSON.stringify(seed, null, 2), "utf-8");
  }
}

export function readPlugins(): StoredPlugin[] {
  ensureFile();
  return JSON.parse(fs.readFileSync(storePath, "utf-8"));
}

export function savePlugins(list: StoredPlugin[]) {
  ensureFile();
  fs.writeFileSync(storePath, JSON.stringify(list, null, 2), "utf-8");
}

export function upsertPlugin(plugin: StoredPlugin) {
  const list = readPlugins();
  const idx = list.findIndex((p) => p.key === plugin.key);
  if (idx >= 0) list[idx] = { ...list[idx], ...plugin };
  else list.push(plugin);
  savePlugins(list);
  return plugin;
}

export function togglePlugin(key: string, enabled: boolean) {
  const list = readPlugins();
  const idx = list.findIndex((p) => p.key === key);
  if (idx >= 0) {
    list[idx].isEnabled = enabled;
    savePlugins(list);
    return list[idx];
  }
  throw new Error("Plugin not found");
}
