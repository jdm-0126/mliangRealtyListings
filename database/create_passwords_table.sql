-- Create password management table
CREATE TABLE IF NOT EXISTS agent_passwords (
    id BIGSERIAL PRIMARY KEY,
    agent_id BIGINT REFERENCES agents(id) ON DELETE CASCADE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shared passwords table for broker/admin
CREATE TABLE IF NOT EXISTS shared_passwords (
    id BIGSERIAL PRIMARY KEY,
    password_type TEXT NOT NULL, -- 'agent', 'broker', 'superadmin'
    password_hash TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_passwords_agent_id ON agent_passwords(agent_id);
CREATE INDEX IF NOT EXISTS idx_shared_passwords_type ON shared_passwords(password_type);

-- Insert default shared passwords (plain text for now, should be hashed in production)
INSERT INTO shared_passwords (password_type, password_hash, created_by) VALUES
('agent', 'agentMliangRealty2026', 'system'),
('broker', 'brokerMliangAdmin2026', 'system'),
('superadmin', 'EuandaiteD_0126', 'system')
ON CONFLICT DO NOTHING;
