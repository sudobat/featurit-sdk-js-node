import {DefaultFeaturitUserContext} from "../../default-featurit-user-context";
import {FeatureFlag} from "../../featurit";
import {FeatureFlagVersionSelector} from "./feature-flag-version-selector";
import {BucketDistributor} from "./bucket-distributors/bucket-distributor";

describe("FeatureFlagVersionSelector", () => {

  it("Works in a particular case", () => {

    const featureFlag: FeatureFlag = {
      name: "Feat",
      active: true,
      distribution_attribute: "userId",
      segments: [],
      versions: [
        {
          name: "v1",
          distribution_percentage: 70
        },
        {
          name: "v2",
          distribution_percentage: 20
        },
        {
          name: "v3",
          distribution_percentage: 10
        },
      ],
      selected_version: null
    };

    const featuritUserContext = new DefaultFeaturitUserContext("1234", null, null);

    const featureFlagVersionSelector = new FeatureFlagVersionSelector(new MockBucketDistributor());

    const selectedFeatureFlagVersion = featureFlagVersionSelector.select(featureFlag, featuritUserContext);

    expect(selectedFeatureFlagVersion).not.toBeNull();
    expect(selectedFeatureFlagVersion!.name).toEqual("v2");
  });
});

class MockBucketDistributor implements BucketDistributor {

  public distribute(
    featureName: string,
    featureRolloutAttributeValue: string | number | undefined
  ): number {
    return 75;
  }
}