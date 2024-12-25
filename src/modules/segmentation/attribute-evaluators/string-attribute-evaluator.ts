import {AttributeEvaluator} from "./attribute-evaluator";

export enum StringOperators {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  IS_CONTAINED_IN = 'IS_CONTAINED_IN',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH'
}

export class StringAttributeEvaluator implements AttributeEvaluator {

  public evaluate(
    value1: string,
    operator: string,
    value2: string
  ): boolean {
    switch (operator) {
      case StringOperators.EQUALS:
        return value1 == value2;
      case StringOperators.NOT_EQUALS:
        return value1 != value2;
      case StringOperators.CONTAINS:
        return value1 ? value1.includes(value2) : false;
      case StringOperators.IS_CONTAINED_IN:
        return value2 ? value2.includes(value1) : false;
      case StringOperators.STARTS_WITH:
        return value1 ? value1.startsWith(value2) : false;
      case StringOperators.ENDS_WITH:
        return value1 ? value1.endsWith(value2) : false;
      default:
        return false;
    }
  }
}
