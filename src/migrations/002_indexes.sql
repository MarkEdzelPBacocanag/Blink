CREATE INDEX IF NOT EXISTS idx_residents_name ON Residents(name);
CREATE INDEX IF NOT EXISTS idx_requests_resident ON Requests(resident_ID);
CREATE INDEX IF NOT EXISTS idx_requests_service ON Requests(service_ID);
CREATE INDEX IF NOT EXISTS idx_requests_status ON Requests(status);
CREATE INDEX IF NOT EXISTS idx_requests_date ON Requests(date_Requested);
CREATE INDEX IF NOT EXISTS idx_assignments_staff ON Assignments(staff_ID);
CREATE INDEX IF NOT EXISTS idx_assignments_request ON Assignments(request_ID);
