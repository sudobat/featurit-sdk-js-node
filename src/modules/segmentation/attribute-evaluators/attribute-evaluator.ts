export enum AttributeTypes {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
}

export enum BaseAttributes {
  USER_ID= 'userId',
  SESSION_ID = 'sessionId',
  IP_ADDRESS = 'ipAddress',
}

export enum BaseVersions {
  DEFAULT = 'default',
}

export interface AttributeEvaluator {

  evaluate(
    value1: number | string,
    operator: string,
    value2: number | string
  ): boolean;
}
