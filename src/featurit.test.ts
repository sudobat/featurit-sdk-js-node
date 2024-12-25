import {DEFAULT_VERSION, Featurit, STORAGE_KEY} from "./featurit";
import fetchMock from "jest-fetch-mock";
import * as mockResponseWithContext from "../test/mockApiResponseWithContext.json";
import * as mockResponseWithoutContext from "../test/mockApiResponseWithoutContext.json";
import {DefaultFeaturitUserContext} from "./default-featurit-user-context";
import {DefaultFeaturitUserContextProvider} from "./default-featurit-user-context-provider";
import {FeaturitUserContext} from "./featurit-user-context";
import {DiskFeaturitCache} from "./disk-featurit-cache";
import {FeaturitUserContextProvider} from "./featurit-user-context-provider";

jest.useFakeTimers();

describe("Featurit", () => {
  const TENANT_IDENTIFIER = "tenant-name";

  const INVALID_API_KEY = "f48c1378-24dc-4d04-8208-acef34d51dae";
  const VALID_API_KEY = "e39e2919-13ca-4a14-1739-ecdf32d51dba";

  const NON_EXISTING_FEATURE_NAME = "NON_EXISTING_FEATURE_NAME";
  const EXISTING_INACTIVE_FEATURE_NAME = "Feat2";
  const EXISTING_ACTIVE_FEATURE_NAME = "SimpleFeat";

  const SAMPLE_API_RESPONSE = `
  {
    "data": {
      "SimpleFeat": {
        "name": "SimpleFeat",
          "active": true,
          "distribution_attribute": "userId",
          "segments": [],
          "versions": []
      },
      "Feat": {
        "name": "Feat",
          "active": true,
          "distribution_attribute": "userId",
          "segments": [
          {
            "rollout_attribute": "ipAddress",
            "rollout_percentage": 100,
            "string_rules": [
              {
                "attribute": "userId",
                "operator": "EQUALS",
                "value": "1"
              }
            ],
            "number_rules": []
          }
        ],
          "versions": [
          {
            "name": "v1",
            "distribution_percentage": 45
          },
          {
            "name": "v2",
            "distribution_percentage": 55
          }
        ]
      },
      "Feat2": {
        "name": "Feat2",
          "active": false,
          "distribution_attribute": "userId",
          "segments": [
          {
            "rollout_attribute": "ipAddress",
            "rollout_percentage": 100,
            "string_rules": [
              {
                "attribute": "userId",
                "operator": "EQUALS",
                "value": "1"
              }
            ],
            "number_rules": []
          }
        ],
          "versions": [
          {
            "name": "v1",
            "distribution_percentage": 45
          },
          {
            "name": "v2",
            "distribution_percentage": 55
          }
        ]
      }
    }
  }`;

  const cache = new DiskFeaturitCache();

  afterEach(() => {
    fetchMock.resetMocks();
    jest.clearAllTimers();
    cache.remove(STORAGE_KEY.FEATURE_FLAGS);
    cache.remove(STORAGE_KEY.BACKUP);
  });

  test("Can create an instance of FeaturIT client with only tenantIdentifier and backendApiKey arguments.", () => {
    const featurit = createFeaturit();

    expect(featurit).toBeInstanceOf(Featurit);
  });

  test("It calls the backend API when calling the init method.", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockResponseWithoutContext));

    const featurit = createFeaturit();

    await featurit.init();

    const isActive = featurit.isActive("SimpleFeat");

    expect(isActive).toBe(true);
  });

  test("Method isActive returns false when the feature flag doesn't exist.", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockResponseWithoutContext));

    const featurit = createFeaturit();

    await featurit.init();

    const isActive = featurit.isActive("NON_EXISTING_FEATURE");

    expect(isActive).toBe(false);
  });

  test("Method version returns default when no context is sent.", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockResponseWithoutContext));

    const featurit = createFeaturit();

    await featurit.init();

    const version = featurit.version("SimpleFeat");

    expect(version).toBe(DEFAULT_VERSION);
  });

  test("Method version returns default when the feature flag doesn't exist.", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockResponseWithoutContext));

    const featurit = createFeaturit();

    await featurit.init();

    const version = featurit.version("NON_EXISTING_FEATURE");

    expect(version).toBe(DEFAULT_VERSION);
  });

  test("Method version returns the proper value when context is sent.", async () => {
    fetchMock.mockResponseOnce(JSON.stringify(mockResponseWithContext));

    const featurit = createFeaturit(
      new DefaultFeaturitUserContext(
        "1234",
        "1357",
        "192.168.1.1",
      )
    );

    await featurit.init();

    const version = featurit.version("Feat");

    expect(version).toBe("v1");
  });

  test("It works properly even if the API is failing.", async () => {
    await cache.set(
      STORAGE_KEY.BACKUP,
      JSON.parse(SAMPLE_API_RESPONSE).data,
    );

    fetchMock.mockResponseOnce("{}", {status: 500});

    const featurit = createFeaturit(
      new DefaultFeaturitUserContext(
        "1",
        "1",
        "192.168.1.1"
      )
    );

    await featurit.init();

    const isActive = featurit.isActive("Feat");
    const version = featurit.version("Feat");

    expect(isActive).toBe(true);
    expect(version).toBe("v2");
  });

  test("Passing a user context in the constructor overrides the user context provider.", async () => {
    const featurit = createFeaturit(
      new DefaultFeaturitUserContext(
        "1234",
        "1357",
        "192.168.1.1",
      ),
      new DefaultFeaturitUserContextProvider(
        new DefaultFeaturitUserContext("9876", null, "127.0.0.1"),
      )
    );

    const userContext = featurit.getUserContext();

    expect(userContext.getUserId()).toBe("1234");
  });

  test("Passing a user context in the setter overrides the user context provider.", async () => {
    const featurit = createFeaturit(
      undefined,
      new DefaultFeaturitUserContextProvider(
        new DefaultFeaturitUserContext("9876", null, "127.0.0.1"),
      )
    );

    featurit.setUserContext(
      new DefaultFeaturitUserContext("1234", "1357", "192.168.1.1"),
    );

    const userContext = featurit.getUserContext();

    expect(userContext.getUserId()).toBe("1234");
  });

  test("Passing a user context in the setter overrides the user context from the constructor.", async () => {
    const featurit = createFeaturit(
      new DefaultFeaturitUserContext(
        "1234",
        "1357",
        "192.168.1.1",
      )
    );

    featurit.setUserContext(
      new DefaultFeaturitUserContext(
        "9876",
        null,
        "127.0.0.1",
        new Map<string, any>([
          ["role", "admin"],
          ["city", "Barcelona"],
        ]),
      ),
    );

    const userContext = featurit.getUserContext();

    expect(userContext.getCustomAttribute("city")).toBe("Barcelona");
  });

  function createFeaturit(userContext?: FeaturitUserContext, userContextProvider?: FeaturitUserContextProvider): Featurit {
    return new Featurit({
      tenantIdentifier: "test",
      backendApiKey: "test",
      cache: cache,
      featuritUserContext: userContext,
      featuritUserContextProvider: userContextProvider,
      apiClient: fetchMock
    });
  }
});
