import {FeaturitUserContextProvider} from "./featurit-user-context-provider";
import {FeaturitCache} from "./featurit-cache";
import {DefaultFeaturitUserContextProvider} from "./default-featurit-user-context-provider";
import {FeaturitUserContext} from "./featurit-user-context";
import {FeaturitAnalyticsService} from "./modules/analytics/featurit-analytics-service";
import {InMemoryFeaturitCache} from "./in-memory-featurit-cache";
import {FeatureSegmentationService} from "./modules/segmentation/feature-segmentation-service";
import {AttributeTypes} from "./modules/segmentation/attribute-evaluators/attribute-evaluator";
import {StringAttributeEvaluator} from "./modules/segmentation/attribute-evaluators/string-attribute-evaluator";
import {NumberAttributeEvaluator} from "./modules/segmentation/attribute-evaluators/number-attribute-evaluator";
import {MurmurBucketDistributor} from "./modules/segmentation/bucket-distributors/murmur-bucket-distributor";
import {FeatureFlagVersionSelector} from "./modules/segmentation/feature-flag-version-selector";
import {BucketDistributor} from "./modules/segmentation/bucket-distributors/bucket-distributor";
import {DiskFeaturitCache} from "./disk-featurit-cache";

const DEFAULT_REFRESH_INTERVAL_MINUTES = 5;
const DEFAULT_SEND_ANALYTICS_INTERVAL_MINUTES = 1;
export const DEFAULT_VERSION = "default";

export const STORAGE_KEY = {
  FEATURE_FLAGS: "featureFlags",
  ANALYTICS: "analytics",
  BACKUP: "backup",
};

export const FEATURIT_EVENTS = {
  CHANGED: "changed",
};

export interface FeaturitSetup {
  tenantIdentifier: string;
  backendApiKey: string;
  enableAnalytics?: boolean;
  refreshIntervalMinutes?: number;
  sendAnalyticsIntervalMinutes?: number;
  featuritUserContext?: FeaturitUserContext;
  featuritUserContextProvider?: FeaturitUserContextProvider;
  cache?: FeaturitCache;
  apiClient?: unknown;
}

export interface FeatureFlag {
  name: string;
  active: boolean;
  distribution_attribute: string;
  segments: FeatureFlagSegment[];
  versions: FeatureFlagVersion[];
  selected_version?: FeatureFlagVersion | null;
}

export interface FeatureFlagSegment {
  rollout_attribute: string;
  rollout_percentage: number;
  string_rules: StringSegmentRule[];
  number_rules: NumberSegmentRule[];
}

export interface StringSegmentRule {
  attribute: string;
  operator: string;
  value: string;
}

export interface NumberSegmentRule {
  attribute: string;
  operator: string;
  value: number;
}

export interface FeatureFlagVersion {
  name: string;
  distribution_percentage: number;
}

export interface FeatureFlagList {
  [featureName: string]: FeatureFlag;
}

function resolveFetch() {
  try {
    if (typeof window !== "undefined" && "fetch" in window) {
      return fetch.bind(window);
    } else if ("fetch" in globalThis) {
      return fetch.bind(globalThis);
    }
  } catch (e) {
    console.error("Can't resolve fetch.", e);
  }

  return undefined;
}

export class Featurit {
  private readonly tenantIdentifier: string;
  private readonly backendApiKey: string;
  private readonly isAnalyticsEnabled: boolean;

  private featuritUserContextProvider: FeaturitUserContextProvider =
    new DefaultFeaturitUserContextProvider();

  private readonly cache: FeaturitCache;
  private readonly backupCache: FeaturitCache;

  private readonly apiClient: any;
  private readonly apiBaseUrl: string;

  private readonly featureSegmentationService: FeatureSegmentationService;

  private readonly refreshIntervalMinutes: number;
  private readonly sendAnalyticsIntervalMinutes: number;
  private analyticsService: FeaturitAnalyticsService;

  private featureFlags: Map<string, FeatureFlag> = new Map<
    string,
    FeatureFlag
  >();

  private timer: any;

  constructor({
                tenantIdentifier,
                backendApiKey,
                enableAnalytics = false,
                refreshIntervalMinutes = DEFAULT_REFRESH_INTERVAL_MINUTES,
                sendAnalyticsIntervalMinutes = DEFAULT_SEND_ANALYTICS_INTERVAL_MINUTES,
                featuritUserContext,
                featuritUserContextProvider = new DefaultFeaturitUserContextProvider(),
                cache = new DiskFeaturitCache(),
                apiClient = resolveFetch(),
              }: FeaturitSetup) {
    this.tenantIdentifier = tenantIdentifier;
    this.backendApiKey = backendApiKey;

    this.cache = cache ?? new DiskFeaturitCache();
    this.backupCache = cache ?? new DiskFeaturitCache();

    this.setFeaturitUserContextProvider(
      featuritUserContext,
      featuritUserContextProvider,
    );

    this.refreshIntervalMinutes =
      refreshIntervalMinutes ?? DEFAULT_REFRESH_INTERVAL_MINUTES;

    this.apiClient = apiClient;
    this.apiBaseUrl = `https://${this.tenantIdentifier}.featurit.com/api/v1/${this.backendApiKey}`;

    const bucketDistributor: BucketDistributor = new MurmurBucketDistributor();
    this.featureSegmentationService = new FeatureSegmentationService(
      {
        [AttributeTypes.STRING]: new StringAttributeEvaluator(),
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator()
      },
      bucketDistributor,
      new FeatureFlagVersionSelector(bucketDistributor)
    );

    this.isAnalyticsEnabled = enableAnalytics ?? false;
    this.sendAnalyticsIntervalMinutes =
      sendAnalyticsIntervalMinutes ?? DEFAULT_SEND_ANALYTICS_INTERVAL_MINUTES;

    this.analyticsService = new FeaturitAnalyticsService(
      this.cache,
      this.apiClient,
      this.sendAnalyticsIntervalMinutes,
      this.apiBaseUrl,
    );

    this.getFeatureFlagsFromStorage();
  }

  public async init(): Promise<void> {
    if (!!this.timer) {
      return;
    }

    this.timer = setInterval(
      () => {
        this.getFeatureFlagsFromAPI();
      },
      this.refreshIntervalMinutes * 1000 * 60,
    );

    await this.getFeatureFlagsFromAPI();

    if (this.isAnalyticsEnabled) {
      this.analyticsService.init();
    }
  }

  public async refresh(): Promise<void> {
    await this.getFeatureFlagsFromAPI();
  }

  public isActive(featureName: string): boolean {
    const featureFlag: FeatureFlag | undefined =
      this.featureFlags.get(featureName);

    if (featureFlag === undefined) {
      return false;
    }

    if (this.isAnalyticsEnabled) {
      this.analyticsService.registerFeatureFlagRequest(
        featureName,
        featureFlag,
        new Date(),
      );
    }

    return featureFlag.active ?? false;
  }

  public version(featureName: string): string {
    return this.featureFlags.get(featureName)?.selected_version?.name ?? DEFAULT_VERSION;
  }

  public getUserContext(): FeaturitUserContext {
    return this.featuritUserContextProvider.getUserContext();
  }

  public setUserContext(featuritUserContext: FeaturitUserContext): void {
    this.setFeaturitUserContextProvider(featuritUserContext);
  }

  private async getFeatureFlagsFromAPI(): Promise<void> {
    const apiUrl = `${this.apiBaseUrl}/feature-flags`;

    try {
      const cacheResponse = await this.cache.get(STORAGE_KEY.FEATURE_FLAGS);

      if (cacheResponse != null) {
        const segmentedFeatureFlags = this.featureSegmentationService.execute(
          JSON.parse(cacheResponse),
          this.getUserContext()
        );

        this.featureFlags = new Map<string, FeatureFlag>();
        for (const featureName in segmentedFeatureFlags) {
          this.featureFlags.set(featureName, segmentedFeatureFlags[featureName]);
        }

        return;
      }

      const response = await this.apiClient(apiUrl, {
        method: "GET",
        cache: "no-cache",
        headers: {
          "User-Agent": "FeaturIT",
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Server Error");
      }

      const data = await response.json();

      if (
        JSON.stringify(Object.fromEntries(this.featureFlags)) ==
        JSON.stringify(data.data)
      ) {
        return;
      }

      const featureFlags: FeatureFlagList = data.data;

      if (featureFlags === undefined) {
        return;
      }

      await this.cache.set(STORAGE_KEY.FEATURE_FLAGS, featureFlags, this.refreshIntervalMinutes);
      await this.backupCache.set(STORAGE_KEY.BACKUP, featureFlags);

      const segmentedFeatureFlags: FeatureFlagList = this.featureSegmentationService.execute(
        featureFlags,
        this.getUserContext()
      );

      this.featureFlags = new Map<string, FeatureFlag>();
      for (const featureName in segmentedFeatureFlags) {
        this.featureFlags.set(featureName, segmentedFeatureFlags[featureName]);
      }
    } catch (error: any) {
      console.error(
        "There has been a problem requesting Feature Flags from the FeaturIT API.",
      );

      const backupFeatureFlags: FeatureFlagList = await this.backupCache.get(STORAGE_KEY.BACKUP);

      if (!backupFeatureFlags) {
        return;
      }

      const segmentedFeatureFlags: FeatureFlagList = this.featureSegmentationService.execute(
        backupFeatureFlags,
        this.getUserContext()
      );

      this.featureFlags = new Map<string, FeatureFlag>();
      for (const featureName in segmentedFeatureFlags) {
        this.featureFlags.set(featureName, segmentedFeatureFlags[featureName]);
      }
    }
  }

  private async getFeatureFlagsFromStorage(): Promise<void> {
    const featureFlags: FeatureFlagList = await this.cache.get(
      STORAGE_KEY.FEATURE_FLAGS,
    );

    if (!featureFlags) {
      return;
    }

    const segmentedFeatureFlags = this.featureSegmentationService.execute(
      featureFlags,
      this.getUserContext()
    );

    this.featureFlags = new Map<string, FeatureFlag>();
    for (let featureName in segmentedFeatureFlags) {
      this.featureFlags.set(featureName, segmentedFeatureFlags[featureName]);
    }
  }

  private setFeaturitUserContextProvider(
    featuritUserContext?: FeaturitUserContext,
    featuritUserContextProvider?: FeaturitUserContextProvider,
  ) {
    if (featuritUserContext !== undefined) {
      this.featuritUserContextProvider = new DefaultFeaturitUserContextProvider(
        featuritUserContext,
      );
      return;
    }

    this.featuritUserContextProvider =
      featuritUserContextProvider ?? new DefaultFeaturitUserContextProvider();
  }
}
