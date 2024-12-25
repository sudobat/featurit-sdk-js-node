import {FeaturitCache} from "./featurit-cache";
import {readFile, unlink, writeFile} from "node:fs/promises";

/**
 * In order to emulate a cache, data will be written in the following format:
 * data (serialized json) | timestamp (expiration date)
 *
 * If no expiration date is set, the timestamp will be set to -1.
 */
export class DiskFeaturitCache implements FeaturitCache {
  private prefix: string = "featurit";

  public async get(key: string, defaultValue?: string): Promise<any | null> {
    try {
      const valueWithExpirationDate = await readFile(this.prepareKey(key), {encoding: 'utf-8'});

      const [value, expirationDate] = valueWithExpirationDate.split("|");

      if (parseInt(expirationDate) == -1) {
        return JSON.parse(value);
      }

      if (parseInt(expirationDate) < Date.now()) {
        return defaultValue ?? null;
      }

      return JSON.parse(value);
    } catch (exception) {
      return defaultValue ?? null;
    }
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      const expirationDate = ttlSeconds ? Date.now() + ttlSeconds * 1_000 : -1;
      await writeFile(this.prepareKey(key), JSON.stringify(value) + "|" + expirationDate);
    } catch (exception) {
      console.error(exception);
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      await unlink(this.prepareKey(key));
    } catch (exception) {
    }
  }

  private prepareKey(key: string): string {
    return `${this.prefix}:${key}`;
  }
}
