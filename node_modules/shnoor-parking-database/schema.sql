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
  amount DECIMAL(10,2) NOT NULL,
  method VARCHAR(30) NOT NULL,
  status VARCHAR(20) DEFAULT 'Completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
