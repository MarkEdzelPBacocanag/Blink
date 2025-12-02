CREATE TRIGGER IF NOT EXISTS trg_requests_status_check
BEFORE UPDATE ON Requests
FOR EACH ROW
BEGIN
  SELECT CASE WHEN NEW.status IN ('Pending','In Progress','Completed') THEN NULL ELSE RAISE(ABORT,'invalid status') END;
END;
