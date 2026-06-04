-- Create brokers table
CREATE TABLE IF NOT EXISTS brokers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    role TEXT NOT NULL DEFAULT 'Broker',
    license_number TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_brokers_email ON brokers(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_brokers_status ON brokers(status);
