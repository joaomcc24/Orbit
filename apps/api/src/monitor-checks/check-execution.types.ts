import type {
  MonitorCheckFailureReason,
  MonitorCheckResult,
} from '@orbit/types';

export type CheckExecutionResult = {
  result: MonitorCheckResult;
  failureReason: MonitorCheckFailureReason | null;
  httpStatusCode: number | null;
  responseTimeMs: number;
  checkedAt: Date;
  errorMessage: string | null;
};

export class ExpectedCheckFailure extends Error {
  constructor(
    readonly reason: MonitorCheckFailureReason,
    message: string,
    readonly httpStatusCode: number | null = null,
  ) {
    super(message);
    this.name = 'ExpectedCheckFailure';
  }
}
