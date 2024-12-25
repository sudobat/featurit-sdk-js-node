import {FeatureFlag, FeatureFlagVersion} from "../../featurit";
import {FeaturitUserContext} from "../../featurit-user-context";
import {BucketDistributor} from "./bucket-distributors/bucket-distributor";

export class FeatureFlagVersionSelector {

  constructor(
    private bucketDistributor: BucketDistributor,
  ) {
  }

  public select(
    featureFlag: FeatureFlag,
    featuritUserContext: FeaturitUserContext
  ): FeatureFlagVersion | null {
    const distributionAttributeName = featureFlag.distribution_attribute;
    const distributionAttributeValue = featuritUserContext.getAttribute(distributionAttributeName);

    const distributionCalculationResult = this.bucketDistributor.distribute(
      featureFlag.name,
      distributionAttributeValue
    );

    let previousDistributionPercentage = 0;
    for (const featureFlagVersion of featureFlag.versions) {
      const distributionPercentage = featureFlagVersion.distribution_percentage;

      if (distributionCalculationResult > (distributionPercentage + previousDistributionPercentage)) {
        previousDistributionPercentage = distributionPercentage;
        continue;
      }

      return featureFlagVersion;
    }

    return null;
  }
}
