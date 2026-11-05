-- Performance Optimization Indexes for Shnoor Parking Management System
-- Added to accelerate high-concurrency read endpoints, dashboard aggregates, and payment analytics

-- 1. Accelerate Payment Analytics & Status Filters
CREATE INDEX IF NOT EXISTS idx_payments_refund_status 
  ON payments(LOWER(refund_status)) 
  WHERE refund_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payments_status_amount 
  ON payments(LOWER(payment_status), amount);

-- 2. Accelerate Parking Slots Occupancy & Availability
CREATE INDEX IF NOT EXISTS idx_parking_slots_status_avail 
  ON parking_slots(LOWER(status), is_available);

CREATE INDEX IF NOT EXISTS idx_parking_slots_zone 
  ON parking_slots(zone);

-- 3. Accelerate Active Sessions & Vehicle History Lookups
CREATE INDEX IF NOT EXISTS idx_vehicle_history_exit_status 
  ON vehicle_history(exit_time, LOWER(status));

-- 4. Accelerate Active Reservations & Occupancy Lookups
CREATE INDEX IF NOT EXISTS idx_reservations_status_end 
  ON reservations(LOWER(status), end_time);

-- 5. Accelerate Active EV Charging Sessions
CREATE INDEX IF NOT EXISTS idx_ev_sessions_status 
  ON ev_charging_sessions(LOWER(session_status));

