import {FeaturitCache} from "./featurit-cache";

export class InMemoryFeaturitCache implements FeaturitCache {
  private prefix: string = "featurit";

  private inMemoryStorage: Map<string, string> = new Map();
  private expirationDates: Map<string, number> = new Map();

  public async get(key: string, defaultValue?: string): Promise<any | null> {
    try {
      const value = this.inMemoryStorage.get(this.prepareKey(key));
      if (value == undefined) {
        return defaultValue ?? null;
      }

      const expirationDate = this.expirationDates.get(this.prepareKey(key));

      if (expirationDate != undefined && expirationDate < Date.now()) {
        this.inMemoryStorage.delete(this.prepareKey(key));
        this.expirationDates.delete(this.prepareKey(key));

        return defaultValue ?? null;
      }

      return JSON.parse(value);
    } catch (exception) {
      console.error(exception);
    }
  }

  public async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      this.inMemoryStorage.set(this.prepareKey(key), JSON.stringify(value));

      if (ttlSeconds) {
        this.expirationDates.set(this.prepareKey(key), Date.now() + ttlSeconds);
      }
    } catch (exception) {
      console.error(exception);
    }
  }

  public async remove(key: string): Promise<void> {
    try {
      this.inMemoryStorage.delete(this.prepareKey(key));
      this.expirationDates.delete(this.prepareKey(key));
    } catch (exception) {
      console.error(exception);
    }
  }

  private prepareKey(key: string): string {
    return `${this.prefix}:${key}`;
  }
}
