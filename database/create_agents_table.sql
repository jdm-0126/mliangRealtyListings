-- Create agents table
CREATE TABLE IF NOT EXISTS agents (
    id BIGSERIAL PRIMARY KEY,
    broker_id BIGINT REFERENCES brokers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'Active',
    license_number TEXT,
    profile_photo TEXT,
    bio TEXT,
    specialization TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agents_email ON agents(email);
CREATE INDEX IF NOT EXISTS idx_agents_broker_id ON agents(broker_id);
CREATE INDEX IF NOT EXISTS idx_agents_status ON agents(status);
