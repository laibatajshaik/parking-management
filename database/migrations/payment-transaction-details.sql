ALTER TABLE payments ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_name VARCHAR(100);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_email VARCHAR(150);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS vehicle_number VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS slot_number VARCHAR(20);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS entry_time TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS exit_time TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS duration VARCHAR(50);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'INR';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS upi_vpa VARCHAR(255);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

UPDATE payments
SET currency = 'INR'
WHERE currency IS NULL OR currency = '';

UPDATE payments
SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
WHERE updated_at IS NULL;

UPDATE payments
SET transaction_id = 'TXN-' || id::text
WHERE transaction_id IS NULL OR transaction_id = '';

UPDATE payments p
SET customer_id = u.id
FROM users u
WHERE p.customer_id IS NULL
  AND p.customer_email IS NOT NULL
  AND LOWER(p.customer_email) = LOWER(u.email);

CREATE INDEX IF NOT EXISTS idx_payments_customer_created_at
  ON payments(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status_created_at
  ON payments(payment_status, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_transaction_id
  ON payments(transaction_id) WHERE transaction_id IS NOT NULL;
