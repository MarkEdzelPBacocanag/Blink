CREATE VIEW IF NOT EXISTS v_request_details AS
SELECT r.request_ID, r.date_Requested, r.status,
       res.resident_ID, res.name AS resident_name,
       s.service_ID, s.service_Type,
       a.assignment_ID, a.staff_ID
FROM Requests r
JOIN Residents res ON r.resident_ID = res.resident_ID
JOIN Services s ON r.service_ID = s.service_ID
LEFT JOIN Assignments a ON a.request_ID = r.request_ID;
