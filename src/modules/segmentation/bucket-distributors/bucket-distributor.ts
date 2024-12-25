export interface BucketDistributor {

  distribute(
    featureName: string,
    featureRolloutAttributeValue: string | number | undefined
  ): number;
}
