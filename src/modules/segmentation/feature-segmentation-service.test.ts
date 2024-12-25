import {FeatureSegmentationService} from "./feature-segmentation-service";
import {DefaultFeaturitUserContext} from "../../default-featurit-user-context";
import {FeatureFlag, FeatureFlagList, FeatureFlagSegment} from "../../featurit";
import {MurmurBucketDistributor} from "./bucket-distributors/murmur-bucket-distributor";
import {FeatureFlagVersionSelector} from "./feature-flag-version-selector";
import {BucketDistributor} from "./bucket-distributors/bucket-distributor";
import {AttributeTypes, BaseAttributes} from "./attribute-evaluators/attribute-evaluator";
import {StringAttributeEvaluator, StringOperators} from "./attribute-evaluators/string-attribute-evaluator";
import {NumberAttributeEvaluator} from "./attribute-evaluators/number-attribute-evaluator";

describe("FeatureSegmentationService", () => {
  let featureSegmentationService: FeatureSegmentationService;

  beforeEach(() => {
    const bucketDistributor: BucketDistributor = new MurmurBucketDistributor();
    featureSegmentationService = new FeatureSegmentationService(
      {
        [AttributeTypes.STRING]: new StringAttributeEvaluator(),
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
      },
      bucketDistributor,
      new FeatureFlagVersionSelector(bucketDistributor)
    );
  });

  it("returns an empty feature array when there are no flags", () => {
    const featuritUserContext = new DefaultFeaturitUserContext(null, null, null);
    const featureFlags: { [featureFlagName: string]: FeatureFlag } = {};

    const segmentedFeatureFlags: FeatureFlagList = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.keys(segmentedFeatureFlags)).toHaveLength(0);
  });

  it("returns the same features when no segmentation is applied", () => {
    const featureFlags = seedOneSimpleFeatureFlag();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(false);

    const featuritUserContext = new DefaultFeaturitUserContext(null, null, null);

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(segmentedFeatureFlags).toEqual(featureFlags);
  });

  it("returns the feature disabled when no segment matches", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithOneUserIdRule();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featuritUserContext = new DefaultFeaturitUserContext('1111', null, null);

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags)[0].active).toBe(false);
  });

  it("returns active false when custom attribute values don't match", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithOneCustomAttributeRule();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featuritUserContext = new DefaultFeaturitUserContext(null, null, null, new Map([
      ["email", "featurit.tech@gmail.com"]
    ]));

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags)[0].active).toBe(false);
  });

  it("returns active true when custom attribute values match", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithOneCustomAttributeRule();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featureSegmentationService = new FeatureSegmentationService({
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      new MurmurBucketDistributor(),
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext = new DefaultFeaturitUserContext(null, null, null, new Map([
      ["email", "info@featurit.com"],
    ]));

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags)[0].active).toBe(true);
  });

  it("returns active false when custom attributes aren't present", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithOneCustomAttributeRule();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featureSegmentationService = new FeatureSegmentationService({
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      new MurmurBucketDistributor(),
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext = new DefaultFeaturitUserContext(null, null, null);

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags)[0].active).toBe(false);
  });

  it("returns active true when the segment matches", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithOneUserIdRule();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featureSegmentationService = new FeatureSegmentationService({
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      new MurmurBucketDistributor(),
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext = new DefaultFeaturitUserContext('12345', null, null);

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags)[0].active).toBe(true);
  });

  it("returns active false when only one of the segment rules matches", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithTwoRules();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featureSegmentationService = new FeatureSegmentationService({
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      new MurmurBucketDistributor(),
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext1 = new DefaultFeaturitUserContext('12345', null, null);

    const segmentedFeatureFlags1 = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext1
    );

    expect(Object.values(segmentedFeatureFlags1)[0].active).toBe(false);

    const featuritUserContext2 = new DefaultFeaturitUserContext(null, null, '127.0.0.1');

    const segmentedFeatureFlags2 = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext2
    );

    expect(Object.values(segmentedFeatureFlags2)[0].active).toBe(false);
  });

  it("returns active true when all of the segment rules match", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithTwoRules();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featureSegmentationService = new FeatureSegmentationService({
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      new MurmurBucketDistributor(),
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext = new DefaultFeaturitUserContext('12345', null, '127.0.0.1');

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags)[0].active).toBe(true);
  });

  it("returns active true when one of the two segments matches", () => {
    const featureFlags = seedOneActiveFeatureFlagWithTwoSegments();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featureSegmentationService = new FeatureSegmentationService({
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      new MurmurBucketDistributor(),
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext1 = new DefaultFeaturitUserContext('12345', null, null);

    const segmentedFeatureFlags1 = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext1
    );

    expect(Object.values(segmentedFeatureFlags1)[0].active).toBe(true);

    const featuritUserContext2 = new DefaultFeaturitUserContext(null, null, '127.0.0.1');

    const segmentedFeatureFlags2 = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext2
    );

    expect(Object.values(segmentedFeatureFlags2)[0].active).toBe(true);

    const featuritUserContext3 = new DefaultFeaturitUserContext('12345', null, '127.0.0.1');

    const segmentedFeatureFlags3 = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext3
    );

    expect(Object.values(segmentedFeatureFlags3)[0].active).toBe(true);
  });

  it("returns active false when none of the segments match", () => {
    const featureFlags = seedOneActiveFeatureFlagWithTwoSegments();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const featureSegmentationService = new FeatureSegmentationService({
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      new MurmurBucketDistributor(),
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext = new DefaultFeaturitUserContext('11111', null, '192.168.1.1');

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags)[0].active).toBe(false);
  });

  it("returns active false when rollout percentage is smaller than rollout bucket", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithOneUserIdRuleAndRolloutPercentage50();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const bucketDistributor: BucketDistributor = new MockBucketDistributor([100]);

    const featureSegmentationService = new FeatureSegmentationService(
      {
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      bucketDistributor,
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext = new DefaultFeaturitUserContext('12345', null, null);

    const segmentedFeatureFlags = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags)[0].active).toBe(false);
  });

  it("returns active true when rollout percentage is greater or equal than rollout bucket", () => {
    const featureFlags = seedOneActiveFeatureFlagWithASegmentWithOneUserIdRuleAndRolloutPercentage50();

    expect(Object.keys(featureFlags)).toHaveLength(1);
    expect(Object.values(featureFlags)[0].active).toBe(true);

    const bucketDistributor: BucketDistributor = new MockBucketDistributor([1, 50]);

    const featureSegmentationService = new FeatureSegmentationService(
      {
        [AttributeTypes.NUMBER]: new NumberAttributeEvaluator(),
        [AttributeTypes.STRING]: new StringAttributeEvaluator()
      },
      bucketDistributor,
      new FeatureFlagVersionSelector(new MurmurBucketDistributor())
    );

    const featuritUserContext = new DefaultFeaturitUserContext('12345', null, null);

    const segmentedFeatureFlags1 = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags1)[0].active).toBe(true);


    const segmentedFeatureFlags2 = featureSegmentationService.execute(
      featureFlags,
      featuritUserContext
    );

    expect(Object.values(segmentedFeatureFlags2)[0].active).toBe(true);
  });

  function seedOneSimpleFeatureFlag(): FeatureFlagList {
    const featureFlag = {
      name: "Simple Feature",
      active: false,
      distribution_attribute: BaseAttributes.USER_ID,
      segments: [],
      versions: [],
      selected_version: null
    };

    return {
      [featureFlag.name]: featureFlag,
    };
  }

  function seedOneActiveFeatureFlagWithASegmentWithOneUserIdRule(): FeatureFlagList {
    const userIdAttribute = BaseAttributes.USER_ID;

    const featureFlagSegment: FeatureFlagSegment = {
      rollout_attribute: userIdAttribute,
      rollout_percentage: 100,
      string_rules: [
        {
          attribute: userIdAttribute,
          operator: StringOperators.EQUALS,
          value: '12345'
        }
      ],
      number_rules: []
    };

    const featureFlag = {
      name: 'Active Feature',
      active: true,
      distribution_attribute: userIdAttribute,
      segments: [featureFlagSegment],
      versions: [],
      selected_version: null
    };

    return {
      [featureFlag.name]: featureFlag,
    };
  }

  function seedOneActiveFeatureFlagWithASegmentWithOneCustomAttributeRule(): FeatureFlagList {
    const userIdAttribute = BaseAttributes.USER_ID;
    const emailAttribute = 'email';

    const featureFlagSegment: FeatureFlagSegment = {
      rollout_attribute: userIdAttribute,
      rollout_percentage: 100,
      string_rules: [
        {
          attribute: emailAttribute,
          operator: StringOperators.ENDS_WITH,
          value: '@featurit.com'
        }
      ],
      number_rules: []
    };

    const featureFlag = {
      name: 'Active Feature',
      active: true,
      distribution_attribute: userIdAttribute,
      segments: [featureFlagSegment],
      versions: [],
      selected_version: null
    };

    return {
      [featureFlag.name]: featureFlag,
    };
  }

  function seedOneActiveFeatureFlagWithASegmentWithTwoRules(): FeatureFlagList {
    const userIdAttribute = BaseAttributes.USER_ID;
    const ipAddressAttribute = BaseAttributes.IP_ADDRESS;

    const featureFlagSegment = {
      rollout_attribute: userIdAttribute,
      rollout_percentage: 100,
      string_rules: [
        {
          attribute: userIdAttribute,
          operator: StringOperators.EQUALS,
          value: '12345'
        },
        {
          attribute: ipAddressAttribute,
          operator: StringOperators.EQUALS,
          value: '127.0.0.1'
        }
      ],
      number_rules: []
    };

    const featureFlag = {
      name: 'Active Feature',
      active: true,
      distribution_attribute: userIdAttribute,
      segments: [featureFlagSegment],
      versions: []
    };

    return {
      [featureFlag.name]: featureFlag,
    };
  }

  function seedOneActiveFeatureFlagWithTwoSegments(): FeatureFlagList {
    const userIdAttribute = BaseAttributes.USER_ID;
    const ipAddressAttribute = BaseAttributes.IP_ADDRESS;

    const userIdFeatureFlagSegment = {
      rollout_attribute: userIdAttribute,
      rollout_percentage: 100,
      string_rules: [
        {
          attribute: userIdAttribute,
          operator: StringOperators.EQUALS,
          value: '12345'
        }
      ],
      number_rules: []
    };

    const ipAddressFeatureFlagSegment = {
      rollout_attribute: userIdAttribute,
      rollout_percentage: 100,
      string_rules: [
        {
          attribute: ipAddressAttribute,
          operator: StringOperators.EQUALS,
          value: '127.0.0.1'
        }
      ],
      number_rules: []
    };

    const featureFlag = {
      name: 'Active Feature',
      active: true,
      distribution_attribute: userIdAttribute,
      segments: [
        userIdFeatureFlagSegment,
        ipAddressFeatureFlagSegment,
      ],
      versions: []
    };

    return {
      [featureFlag.name]: featureFlag,
    };
  }

  function seedOneActiveFeatureFlagWithASegmentWithOneUserIdRuleAndRolloutPercentage50(): FeatureFlagList {
    const userIdAttribute = BaseAttributes.USER_ID;

    const featureFlagSegment = {
      rollout_attribute: userIdAttribute,
      rollout_percentage: 50,
      string_rules: [
        {
          attribute: userIdAttribute,
          operator: StringOperators.EQUALS,
          value: '12345'
        }
      ],
      number_rules: []
    };

    const featureFlag = {
      name: 'Active Feature',
      active: true,
      distribution_attribute: userIdAttribute,
      segments: [featureFlagSegment],
      versions: []
    };

    return {
      [featureFlag.name]: featureFlag,
    };
  }

  class MockBucketDistributor implements BucketDistributor {
    private timesCalled: number = 0;

    constructor(private mockReturnValues: number[]) {
    }

    distribute(featureName: string, featureRolloutAttributeValue: string | number | undefined): number {
      if (this.timesCalled >= this.mockReturnValues.length) {
        throw new Error("Mock value out of range");
      }

      const returnValue = this.mockReturnValues[this.timesCalled];
      this.timesCalled++;

      return returnValue;
    }
  }
});