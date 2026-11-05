CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'customer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parking_slots (
  id SERIAL PRIMARY KEY,
  slot_number VARCHAR(10) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'available',
  zone VARCHAR(20) DEFAULT 'Zone A',
  slot_type VARCHAR(20) DEFAULT 'Standard',
  is_available BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS zone VARCHAR(20) DEFAULT 'Zone A';
ALTER TABLE parking_slots ADD COLUMN IF NOT EXISTS slot_type VARCHAR(20) DEFAULT 'Standard';

CREATE TABLE IF NOT EXISTS parking_sessions (
  id SERIAL PRIMARY KEY,
  vehicle_number VARCHAR(20) NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  slot_number VARCHAR(10) NOT NULL,
  entry_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration VARCHAR(20) DEFAULT '1h 24m',
  fee DECIMAL(10,2) DEFAULT 60.00,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  transaction_id VARCHAR(50),
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(30) NOT NULL,
  payment_method VARCHAR(50),
  payment_status VARCHAR(50) DEFAULT 'Completed',
  status VARCHAR(20) DEFAULT 'Completed',
  customer_id INTEGER REFERENCES users(id),
  customer_name VARCHAR(100),
  customer_email VARCHAR(150),
  customer_phone VARCHAR(50),
  vehicle_number VARCHAR(50),
  slot_number VARCHAR(20),
  entry_time TIMESTAMP,
  exit_time TIMESTAMP,
  duration VARCHAR(50),
  booking_id VARCHAR(50),
  parking_session_id INTEGER,
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_refund_id VARCHAR(100),
  refund_amount DECIMAL(10,2),
  refund_status VARCHAR(30),
  currency VARCHAR(3) DEFAULT 'INR',
  upi_vpa VARCHAR(255),
  paid_at TIMESTAMP,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_email VARCHAR(150);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS slot_number VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS booking_id VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS parking_session_id INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'Completed';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS razorpay_refund_id VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS refund_status VARCHAR(30);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS upi_vpa VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE payments
SET transaction_id = 'TXN-' || id::text
WHERE transaction_id IS NULL OR transaction_id = '';
UPDATE payments SET currency = 'INR' WHERE currency IS NULL OR currency = '';
UPDATE payments SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP) WHERE updated_at IS NULL;
UPDATE payments p
SET customer_id = u.id
FROM users u
WHERE p.customer_id IS NULL
  AND p.customer_email IS NOT NULL
  AND LOWER(p.customer_email) = LOWER(u.email);

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
  ON payments(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_id
  ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
  ON payments(razorpay_payment_id) WHERE razorpay_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_refund_id
  ON payments(razorpay_refund_id) WHERE razorpay_refund_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_customer_created_at ON payments(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created_at ON payments(payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_refund_status ON payments(LOWER(refund_status)) WHERE refund_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status_amount ON payments(LOWER(payment_status), amount);
CREATE INDEX IF NOT EXISTS idx_parking_slots_status_avail ON parking_slots(LOWER(status), is_available);
CREATE INDEX IF NOT EXISTS idx_parking_slots_zone ON parking_slots(zone);
CREATE INDEX IF NOT EXISTS idx_vehicle_history_exit_status ON vehicle_history(exit_time, LOWER(status));
CREATE INDEX IF NOT EXISTS idx_reservations_status_end ON reservations(LOWER(status), end_time);
CREATE INDEX IF NOT EXISTS idx_ev_sessions_status ON ev_charging_sessions(LOWER(session_status));

CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  event_id VARCHAR(150) PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parking_activities (
  id SERIAL PRIMARY KEY,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  badge_type VARCHAR(20) DEFAULT 'info',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO parking_slots (slot_number, status, zone, slot_type, is_available) VALUES
  ('A1', 'occupied', 'Zone A', 'Standard', false),
  ('A2', 'available', 'Zone A', 'Standard', true),
  ('A3', 'occupied', 'Zone A', 'Standard', false),
  ('A4', 'reserved', 'Zone A', 'Standard', false),
  ('A5', 'occupied', 'Zone A', 'Standard', false),
  ('A6', 'available', 'Zone A', 'Standard', true),
  ('B1', 'occupied', 'Zone B', 'VIP', false),
  ('B2', 'occupied', 'Zone B', 'VIP', false),
  ('B3', 'available', 'Zone B', 'VIP', true),
  ('B4', 'available', 'Zone B', 'VIP', true),
  ('B5', 'reserved', 'Zone B', 'VIP', false),
  ('B6', 'available', 'Zone B', 'VIP', true),
  ('C1', 'available', 'Zone C', 'EV Charging', true),
  ('C2', 'occupied', 'Zone C', 'EV Charging', false),
  ('C3', 'maintenance', 'Zone C', 'EV Charging', false),
  ('C4', 'occupied', 'Zone C', 'EV Charging', false),
  ('C5', 'available', 'Zone C', 'EV Charging', true),
  ('C6', 'available', 'Zone C', 'EV Charging', true),
  ('D1', 'occupied', 'Zone D', 'Two-Wheeler', false),
  ('D2', 'occupied', 'Zone D', 'Two-Wheeler', false),
  ('D3', 'available', 'Zone D', 'Two-Wheeler', true),
  ('D4', 'available', 'Zone D', 'Two-Wheeler', true),
  ('D5', 'occupied', 'Zone D', 'Two-Wheeler', false),
  ('D6', 'available', 'Zone D', 'Two-Wheeler', true)
ON CONFLICT (slot_number) DO UPDATE SET 
  status = EXCLUDED.status,
  zone = EXCLUDED.zone,
  slot_type = EXCLUDED.slot_type,
  is_available = EXCLUDED.is_available;

INSERT INTO parking_sessions (vehicle_number, customer_name, slot_number, entry_time, duration, fee, status) VALUES
  ('KA-05-MH-1234', 'Rahul Sharma', 'A1', NOW() - INTERVAL '2 hours 15 minutes', '2h 15m', 80.00, 'Active'),
  ('MH-12-AB-9876', 'Priya Patel', 'A3', NOW() - INTERVAL '1 hour 45 minutes', '1h 45m', 60.00, 'Active'),
  ('DL-01-CA-5521', 'Amit Kumar', 'A5', NOW() - INTERVAL '45 minutes', '45m', 40.00, 'Active'),
  ('KA-03-EQ-4412', 'Sneha Roy', 'B1', NOW() - INTERVAL '3 hours 10 minutes', '3h 10m', 150.00, 'Active'),
  ('TS-08-AZ-7788', 'Vikram Rao', 'B2', NOW() - INTERVAL '50 minutes', '50m', 80.00, 'Active'),
  ('MH-02-EE-3344', 'Ananya Deshmukh', 'C2', NOW() - INTERVAL '1 hour 20 minutes', '1h 20m', 90.00, 'Active'),
  ('KA-04-EV-9900', 'Karthik Nair', 'C4', NOW() - INTERVAL '2 hours 50 minutes', '2h 50m', 120.00, 'Active'),
  ('KA-01-BK-8822', 'Deepak Verma', 'D1', NOW() - INTERVAL '30 minutes', '30m', 30.00, 'Active'),
  ('KA-02-TR-1199', 'Pooja Hegde', 'D2', NOW() - INTERVAL '2 hours 5 minutes', '2h 05m', 50.00, 'Active'),
  ('TS-09-BK-6677', 'Farhan Ali', 'D5', NOW() - INTERVAL '1 hour 10 minutes', '1h 10m', 40.00, 'Active')
ON CONFLICT DO NOTHING;

INSERT INTO payments (amount, method, status, created_at) VALUES
  (120.00, 'UPI', 'Completed', NOW() - INTERVAL '10 minutes'),
  (80.00, 'Fastag', 'Completed', NOW() - INTERVAL '25 minutes'),
  (200.00, 'Credit Card', 'Completed', NOW() - INTERVAL '40 minutes'),
  (50.00, 'Cash', 'Completed', NOW() - INTERVAL '1 hour'),
  (150.00, 'UPI', 'Completed', NOW() - INTERVAL '1 hour 30 minutes'),
  (90.00, 'Fastag', 'Completed', NOW() - INTERVAL '2 hours'),
  (300.00, 'Credit Card', 'Completed', NOW() - INTERVAL '2 hours 15 minutes'),
  (60.00, 'UPI', 'Completed', NOW() - INTERVAL '3 hours'),
  (40.00, 'Cash', 'Completed', NOW() - INTERVAL '3 hours 45 minutes'),
  (250.00, 'Fastag', 'Completed', NOW() - INTERVAL '4 hours')
ON CONFLICT DO NOTHING;

INSERT INTO parking_activities (activity_type, description, badge_type, created_at) VALUES
  ('Entry', 'Vehicle KA-05-MH-1234 checked in at Slot A1', 'entry', NOW() - INTERVAL '5 minutes'),
  ('Payment', 'Payment of ₹120.00 received via UPI for Slot B4', 'payment', NOW() - INTERVAL '12 minutes'),
  ('Exit', 'Vehicle KA-01-XY-9082 checked out from Slot D4', 'exit', NOW() - INTERVAL '22 minutes'),
  ('Reservation', 'Slot B5 reserved by Meera Sen (VIP)', 'reservation', NOW() - INTERVAL '35 minutes'),
  ('Status Change', 'Slot C3 flagged for EV Charger Maintenance', 'maintenance', NOW() - INTERVAL '48 minutes'),
  ('Payment', 'Payment of ₹80.00 received via Fastag for Slot A6', 'payment', NOW() - INTERVAL '1 hour 5 minutes'),
  ('Entry', 'Vehicle MH-02-EE-3344 entered and parked at Slot C2', 'entry', NOW() - INTERVAL '1 hour 20 minutes')
ON CONFLICT DO NOTHING;
