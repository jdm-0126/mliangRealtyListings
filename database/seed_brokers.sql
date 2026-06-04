-- Seed data for brokers table
-- Run this in Supabase SQL Editor after creating the brokers table

-- First, ensure the table exists
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

-- Insert seed data
INSERT INTO brokers (name, email, phone, status, role, license_number) VALUES
-- Brokers
('Maria Santos', 'maria.santos@mliangrealty.com', '09171234567', 'Active', 'Broker', 'PRC-0012345'),
('Juan dela Cruz', 'juan.delacruz@mliangrealty.com', '09181234567', 'Active', 'Broker', 'PRC-0012346'),
('Ana Reyes', 'ana.reyes@mliangrealty.com', '09191234567', 'Active', 'Broker', 'PRC-0012347'),

-- Agents
('Pedro Garcia', 'pedro.garcia@mliangrealty.com', '09201234567', 'Active', 'Agent', 'PRC-0012348'),
('Rosa Martinez', 'rosa.martinez@mliangrealty.com', '09211234567', 'Active', 'Agent', 'PRC-0012349'),
('Carlos Ramos', 'carlos.ramos@mliangrealty.com', '09221234567', 'Active', 'Agent', 'PRC-0012350'),
('Sofia Cruz', 'sofia.cruz@mliangrealty.com', '09231234567', 'Inactive', 'Agent', 'PRC-0012351'),
('Miguel Torres', 'miguel.torres@mliangrealty.com', '09241234567', 'Active', 'Agent', 'PRC-0012352'),

-- Admins
('Linda Fernandez', 'linda.fernandez@mliangrealty.com', '09251234567', 'Active', 'Admin', 'PRC-0012353'),
('Roberto Mendoza', 'roberto.mendoza@mliangrealty.com', '09261234567', 'Active', 'Admin', 'PRC-0012354'),

-- More Agents
('Isabel Santos', 'isabel.santos@mliangrealty.com', '09271234567', 'Active', 'Agent', 'PRC-0012355'),
('Antonio Lopez', 'antonio.lopez@mliangrealty.com', '09281234567', 'Active', 'Agent', 'PRC-0012356'),
('Carmen Reyes', 'carmen.reyes@mliangrealty.com', '09291234567', 'Suspended', 'Agent', 'PRC-0012357'),
('Diego Morales', 'diego.morales@mliangrealty.com', '09301234567', 'Active', 'Agent', 'PRC-0012358'),
('Elena Castillo', 'elena.castillo@mliangrealty.com', '09311234567', 'Active', 'Agent', 'PRC-0012359')

ON CONFLICT (email) DO NOTHING;

-- Verify the data was inserted
SELECT * FROM brokers ORDER BY created_at DESC;
