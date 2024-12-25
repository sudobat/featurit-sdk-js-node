import {NumberAttributeEvaluator, NumberOperators} from "./number-attribute-evaluator";

describe("NumberAttributeEvaluator", () => {
  test("LESS_THAN operator", () => {
    expect(evaluate(1, NumberOperators.LESS_THAN, 3)).toBe(true);
    expect(evaluate(-1, NumberOperators.LESS_THAN, 1)).toBe(true);
    expect(evaluate(1, NumberOperators.LESS_THAN, 1)).toBe(false);
    expect(evaluate(5, NumberOperators.LESS_THAN, 1)).toBe(false);
  });

  test("LESS_EQUAL_THAN operator", () => {
    expect(evaluate(0, NumberOperators.LESS_EQUAL_THAN, 1)).toBe(true);
    expect(evaluate(0, NumberOperators.LESS_EQUAL_THAN, 0)).toBe(true);
    expect(evaluate(3, NumberOperators.LESS_EQUAL_THAN, 2)).toBe(false);
  });

  test("EQUAL operator", () => {
    expect(evaluate(1, NumberOperators.EQUAL, 1)).toBe(true);
    expect(evaluate(10, NumberOperators.EQUAL, 6)).toBe(false);
  });

  test("NOT_EQUAL operator", () => {
    expect(evaluate(-5, NumberOperators.NOT_EQUAL, 5)).toBe(true);
    expect(evaluate(-10, NumberOperators.NOT_EQUAL, -10)).toBe(false);
  });

  test("GREATER_EQUAL_THAN operator", () => {
    expect(evaluate(11, NumberOperators.GREATER_EQUAL_THAN, 1)).toBe(true);
    expect(evaluate(4, NumberOperators.GREATER_EQUAL_THAN, 4)).toBe(true);
    expect(evaluate(7, NumberOperators.GREATER_EQUAL_THAN, 22)).toBe(false);
  });

  test("GREATER_THAN operator", () => {
    expect(evaluate(-2, NumberOperators.GREATER_THAN, -3)).toBe(true);
    expect(evaluate(6, NumberOperators.GREATER_THAN, 5)).toBe(true);
    expect(evaluate(1, NumberOperators.GREATER_THAN, 1)).toBe(false);
    expect(evaluate(5, NumberOperators.GREATER_THAN, 10)).toBe(false);
  });
});

function evaluate(value1: number, operator: string, value2: number): boolean {
  const numberAttributeEvaluator = new NumberAttributeEvaluator();
  return numberAttributeEvaluator.evaluate(value1, operator, value2);
}