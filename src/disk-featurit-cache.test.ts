import {DiskFeaturitCache} from "./disk-featurit-cache";
import {STORAGE_KEY} from "./featurit";

describe("DiskFeaturitCache", () => {
  const diskFeaturitCache = new DiskFeaturitCache();

  beforeEach(async () => {
    await diskFeaturitCache.remove("DFC_" + STORAGE_KEY.FEATURE_FLAGS);
    await diskFeaturitCache.remove("DFC_" + STORAGE_KEY.BACKUP);
  });

  afterEach(async () => {
    await diskFeaturitCache.remove("DFC_" + STORAGE_KEY.FEATURE_FLAGS);
    await diskFeaturitCache.remove("DFC_" + STORAGE_KEY.BACKUP);
  });

  test("It writes and reads a featureFlag configuration properly", async () => {
    const value = {
      FEATURE_NAME: "FEATURE_VALUE"
    };
    await diskFeaturitCache.set("DFC_" + STORAGE_KEY.FEATURE_FLAGS, value);
    const recoveredValue = await diskFeaturitCache.get("DFC_" + STORAGE_KEY.FEATURE_FLAGS);

    expect(recoveredValue).toEqual(value);
  });

  test("It works properly with the TTL", async () => {
    const value = {
      FEATURE_NAME: "FEATURE_VALUE"
    };
    await diskFeaturitCache.set("DFC_" + STORAGE_KEY.FEATURE_FLAGS, value, 1);
    await timeout(750);
    const recoveredValue1 = await diskFeaturitCache.get("DFC_" + STORAGE_KEY.FEATURE_FLAGS);

    expect(recoveredValue1).toEqual(value);

    await timeout(750);
    const recoveredValue2 = await diskFeaturitCache.get("DFC_" + STORAGE_KEY.FEATURE_FLAGS);

    expect(recoveredValue2).toBeNull();

  });

  test("It can override an existing value and it refreshes the TTL", async () => {
    const value1 = {
      FEATURE_NAME1: "FEATURE_VALUE1"
    };
    await diskFeaturitCache.set("DFC_" + STORAGE_KEY.FEATURE_FLAGS, value1, 1);
    await timeout(500);

    const recoveredValue1 = await diskFeaturitCache.get("DFC_" + STORAGE_KEY.FEATURE_FLAGS);
    expect(recoveredValue1).toEqual(value1);

    const value2 = {
      FEATURE_NAME2: "FEATURE_VALUE2"
    };

    await diskFeaturitCache.set("DFC_" + STORAGE_KEY.FEATURE_FLAGS, value2, 1);
    await timeout(750);

    const recoveredValue2 = await diskFeaturitCache.get("DFC_" + STORAGE_KEY.FEATURE_FLAGS);
    expect(recoveredValue2).toEqual(value2);
  });

  function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
});