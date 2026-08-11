-- Require non-HTTP failures to remain independent of HTTP response data.
-- Existing constraints separately require UP checks to use 2xx/3xx and
-- HTTP_STATUS failures to use 4xx/5xx status codes.
ALTER TABLE "MonitorCheck"
    ADD CONSTRAINT "MonitorCheck_nonHttpFailure_noStatus_check"
        CHECK (
            "failureReason" IS NULL
            OR "failureReason" = 'HTTP_STATUS'
            OR "httpStatusCode" IS NULL
        );
