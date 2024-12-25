import {BucketDistributor} from "./bucket-distributor";
import murmurhash from "murmurhash";

export class MurmurBucketDistributor implements BucketDistributor {

  public distribute(
    featureName: string,
    featureRolloutAttributeValue: string | number | undefined = ""
  ): number {
    return murmurhash.v3(`${featureName}:${featureRolloutAttributeValue}`) % 100 + 1;
  }
}
