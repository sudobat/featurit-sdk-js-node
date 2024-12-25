import {FeatureFlag, FeatureFlagList, FeatureFlagSegment, NumberSegmentRule, StringSegmentRule} from "../../featurit";
import {FeaturitUserContext} from "../../featurit-user-context";
import {AttributeEvaluator, AttributeTypes} from "./attribute-evaluators/attribute-evaluator";
import {BucketDistributor} from "./bucket-distributors/bucket-distributor";
import {FeatureFlagVersionSelector} from "./feature-flag-version-selector";

export class FeatureSegmentationService {

  constructor(
    private attributeEvaluators: {
      [attributeType: string]: AttributeEvaluator
    },
    private bucketDistributor: BucketDistributor,
    private featureFlagVersionSelector: FeatureFlagVersionSelector
  ) {
  }

  public execute(
    featureFlags: FeatureFlagList,
    featuritUserContext: FeaturitUserContext
  ): FeatureFlagList {
    /**
     * - For every Feature Flag
     * - If Feature Flag isActive is TRUE
     * - For every Feature Flag Segment in a Feature Flag
     * - If the Rollout Bucket Calculator is bigger than the Rollout Percentage, the Feature Flag Segment is FALSE
     * - For every Segment Rule in the Feature Flag Segment
     * - Evaluate the Segment Rule against the Featurit User Context
     * - If ALL the Segment Rules in a Feature Flag Segment are TRUE, the Feature Flag Segment is TRUE
     * - If ANY of the Feature Flag Segments in a Feature Flag is TRUE, the Feature Flag is TRUE
     */

    const segmentedFeatureFlags: {
      [featureFlagName: string]: FeatureFlag
    } = {};

    let isSegmentedFeatureFlagActive;
    for (const featureFlag of Object.values(featureFlags)) {

      if (!featureFlag.active || featureFlag.segments.length == 0) {
        isSegmentedFeatureFlagActive = featureFlag.active;
      } else {
        isSegmentedFeatureFlagActive = this.evaluateFeatureFlagSegments(
          featureFlag.name,
          featureFlag.segments,
          featuritUserContext
        );
      }

      const selectedFeatureFlagVersion = this.featureFlagVersionSelector.select(
        featureFlag,
        featuritUserContext
      );

      segmentedFeatureFlags[featureFlag.name] = {
        name: featureFlag.name,
        active: isSegmentedFeatureFlagActive,
        distribution_attribute: featureFlag.distribution_attribute,
        segments: featureFlag.segments,
        versions: featureFlag.versions,
        selected_version: selectedFeatureFlagVersion
      }
    }

    return segmentedFeatureFlags;
  }

  private evaluateFeatureFlagSegments(
    featureFlagName: string,
    featureFlagSegments: FeatureFlagSegment[],
    featuritUserContext: FeaturitUserContext
  ): boolean {
    for (const featureFlagSegment of featureFlagSegments) {
      if (this.evaluateFeatureFlagSegment(featureFlagName, featureFlagSegment, featuritUserContext)) {
        return true;
      }
    }

    return false;
  }

  private evaluateFeatureFlagSegment(
    featureFlagName: string,
    featureFlagSegment: FeatureFlagSegment,
    featuritUserContext: FeaturitUserContext
  ): boolean {
    const rolloutPercentage = featureFlagSegment.rollout_percentage;
    const rolloutAttributeName = featureFlagSegment.rollout_attribute;
    const rolloutAttributeValue = featuritUserContext.getAttribute(rolloutAttributeName);

    if (this.bucketDistributor.distribute(featureFlagName, rolloutAttributeValue) > rolloutPercentage) {
      return false;
    }

    for (const stringSegmentRule of featureFlagSegment.string_rules) {
      if (!this.evaluateSegmentRule(AttributeTypes.STRING, stringSegmentRule, featuritUserContext)) {
        return false;
      }
    }

    for (const numberSegmentRule of featureFlagSegment.number_rules) {
      if (!this.evaluateSegmentRule(AttributeTypes.NUMBER, numberSegmentRule, featuritUserContext)) {
        return false;
      }
    }

    return true;
  }

  private evaluateSegmentRule(
    attributeType: string,
    segmentRule: StringSegmentRule | NumberSegmentRule,
    featuritUserContext: FeaturitUserContext
  ): boolean {
    const attributeName = segmentRule.attribute;
    const operator = segmentRule.operator;
    const segmentRuleAttributeValue = segmentRule.value;
    const featuritUserContextAttributeValue = featuritUserContext.getAttribute(attributeName);

    return this.attributeEvaluators[attributeType].evaluate(
      featuritUserContextAttributeValue,
      operator,
      segmentRuleAttributeValue
    );
  }
}
