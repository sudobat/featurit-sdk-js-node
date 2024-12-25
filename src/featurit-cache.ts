export interface FeaturitCache {
  get: (key: string, defaultValue?: string) => Promise<any | null>;
  set: (key: string, value: any, ttlSeconds?: number) => Promise<void>;
  remove: (key: string) => Promise<void>;
}
