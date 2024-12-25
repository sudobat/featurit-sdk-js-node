import {AttributeEvaluator} from "./attribute-evaluator";

export enum NumberOperators {
  LESS_THAN = 'LESS_THAN',
  LESS_EQUAL_THAN = 'LESS_EQUAL_THAN',
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
  GREATER_EQUAL_THAN = 'GREATER_EQUAL_THAN',
  GREATER_THAN = 'GREATER_THAN'
}

export class NumberAttributeEvaluator implements AttributeEvaluator {

  public evaluate(
    value1: number,
    operator: string,
    value2: number
  ): boolean {
    switch (operator) {
      case NumberOperators.LESS_THAN:
        return value1 < value2;
      case NumberOperators.LESS_EQUAL_THAN:
        return value1 <= value2;
      case NumberOperators.EQUAL:
        return value1 == value2;
      case NumberOperators.NOT_EQUAL:
        return value1 != value2;
      case NumberOperators.GREATER_EQUAL_THAN:
        return value1 >= value2;
      case NumberOperators.GREATER_THAN:
        return value1 > value2;
      default:
        return false;
    }
  }
}
