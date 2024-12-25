import {MurmurBucketDistributor} from "./murmur-bucket-distributor";
import {faker} from "@faker-js/faker/locale/en";

describe("MurmurBucketDistributor", () => {
  test("It returns a number between 1 and 100 when receiving two strings", () => {
    assertBetween1and100(faker.string.uuid(), faker.string.uuid());
  });

  test("It returns a number between 1 and 100 when receiving a numeric rollout attribute", () => {
    assertBetween1and100(faker.string.uuid(), faker.number.int({min: -100, max: 100}));
  });

  test("It returns a number between 1 and 100 when receiving only one string", () => {
    assertBetween1and100(faker.string.uuid(), undefined);
  });
});

function assertBetween1and100(featureName: string, featureRolloutAttributeValue: string | number | undefined) {
  const murmurBucketDistributor = new MurmurBucketDistributor();
  const result: number = murmurBucketDistributor.distribute(featureName, featureRolloutAttributeValue);
  expect(result).toBeGreaterThanOrEqual(1);
  expect(result).toBeLessThanOrEqual(100);
}