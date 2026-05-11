import * as fs from "fs";
import * as path from "path";
import type { Express } from "express";
import { ENV } from "./env";

export function registerStorageProxy(app: Express) {
  app.get("/manus-storage/*", async (req, res) => {
    const key = (req.params as unknown as Record<number, string>)[0];
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    const safeKey = path.normalize(key).replace(/^(?:\.\.[\/\\])+/g, "");
    const localPublicPath = path.resolve(__dirname, "../../client/public", safeKey);

    if (!ENV.forgeApiUrl || !ENV.forgeApiKey) {
      if (fs.existsSync(localPublicPath)) {
        res.sendFile(localPublicPath, err => {
          if (err) {
            console.error("[StorageProxy] failed to send local file:", err);
            res.status(500).send("Internal server error");
          }
        });
        return;
      }

      res.status(404).send("Storage proxy not configured");
      return;
    }

    try {
      const forgeUrl = new URL(
        "v1/storage/presign/get",
        ENV.forgeApiUrl.replace(/\/+$/, "") + "/",
      );
      forgeUrl.searchParams.set("path", key);

      const forgeResp = await fetch(forgeUrl, {
        headers: { Authorization: `Bearer ${ENV.forgeApiKey}` },
      });

      if (!forgeResp.ok) {
        const body = await forgeResp.text().catch(() => "");
        console.error(`[StorageProxy] forge error: ${forgeResp.status} ${body}`);
        res.status(502).send("Storage backend error");
        return;
      }

      const { url } = (await forgeResp.json()) as { url: string };
      if (!url) {
        res.status(502).send("Empty signed URL from backend");
        return;
      }

      res.set("Cache-Control", "no-store");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage proxy error");
    }
  });
}
