import {StringAttributeEvaluator, StringOperators} from "./string-attribute-evaluator";

describe("StringAttributeEvaluator", () => {
  test("EQUALS operator", () => {
    expect(evaluate("", StringOperators.EQUALS, "")).toBe(true);
    expect(evaluate("same", StringOperators.EQUALS, "same")).toBe(true);
    expect(evaluate("nay", StringOperators.EQUALS, "yay")).toBe(false);
    expect(evaluate("", StringOperators.EQUALS, "\n")).toBe(false);
  });

  test("NOT_EQUALS operator", () => {
    expect(evaluate("all that glistens", StringOperators.NOT_EQUALS, "gold")).toBe(true);
    expect(evaluate("fake it", StringOperators.NOT_EQUALS, "make it")).toBe(true);
    expect(evaluate("equals", StringOperators.NOT_EQUALS, "equals")).toBe(false);
  });

  test("CONTAINS operator", () => {
    expect(evaluate("necromancer", StringOperators.CONTAINS, "romance")).toBe(true);
    expect(evaluate("love", StringOperators.CONTAINS, "love")).toBe(true);
    expect(evaluate("magic", StringOperators.CONTAINS, "science")).toBe(false);
  });

  test("IS_CONTAINED_IN operator", () => {
    expect(evaluate("gmail.com", StringOperators.IS_CONTAINED_IN, "featurit@gmail.com")).toBe(true);
    expect(evaluate("12345", StringOperators.IS_CONTAINED_IN, "12345")).toBe(true);
    expect(evaluate("abcdefg", StringOperators.IS_CONTAINED_IN, "abc")).toBe(false);
  });

  test("STARTS_WITH operator", () => {
    expect(evaluate("pee", StringOperators.STARTS_WITH, "p")).toBe(true);
    expect(evaluate("raider", StringOperators.STARTS_WITH, "raid")).toBe(true);
    expect(evaluate("endgame", StringOperators.STARTS_WITH, "game")).toBe(false);
  });

  test("ENDS_WITH operator", () => {
    expect(evaluate("featurit.com", StringOperators.ENDS_WITH, ".com")).toBe(true);
    expect(evaluate("newline\n", StringOperators.ENDS_WITH, "\n")).toBe(true);
    expect(evaluate("anything", StringOperators.ENDS_WITH, "")).toBe(true);
    expect(evaluate("featurit.com", StringOperators.ENDS_WITH, "featurit")).toBe(false);
  });
});

function evaluate(value1: string, operator: string, value2: string): boolean {
  const numberAttributeEvaluator = new StringAttributeEvaluator();
  return numberAttributeEvaluator.evaluate(value1, operator, value2);
}