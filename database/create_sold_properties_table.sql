-- Create sold_properties table for commission tracking
CREATE TABLE IF NOT EXISTS sold_properties (
    id BIGSERIAL PRIMARY KEY,
    property_id INTEGER,
    property_title TEXT NOT NULL,
    property_location TEXT,
    sale_price NUMERIC NOT NULL,
    commission_amount NUMERIC NOT NULL,
    commission_percentage NUMERIC DEFAULT 3.0,
    date_sold TIMESTAMPTZ NOT NULL,
    date_commission_received TIMESTAMPTZ,
    agent_name TEXT,
    broker_name TEXT,
    status TEXT DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sold_properties_date_sold ON sold_properties(date_sold DESC);
CREATE INDEX IF NOT EXISTS idx_sold_properties_status ON sold_properties(status);
CREATE INDEX IF NOT EXISTS idx_sold_properties_agent ON sold_properties(agent_name);

-- Insert sample data
INSERT INTO sold_properties (
    property_id, property_title, property_location, sale_price, 
    commission_amount, commission_percentage, date_sold, 
    date_commission_received, agent_name, broker_name, status
) VALUES
(10, 'Modern House in San Fernando', 'San Fernando, Pampanga', 4500000, 135000, 3.0, '2024-01-15', '2024-01-20', 'Maria Santos', 'Juan Broker', 'Paid'),
(15, 'Commercial Lot in Angeles City', 'Angeles City, Pampanga', 8000000, 240000, 3.0, '2024-01-22', '2024-02-01', 'Pedro Garcia', 'Juan Broker', 'Paid'),
(22, 'Residential Lot in Mexico', 'Mexico, Pampanga', 2500000, 75000, 3.0, '2024-02-10', NULL, 'Rosa Martinez', 'Juan Broker', 'Pending'),
(35, 'Townhouse in Mabalacat', 'Mabalacat, Pampanga', 3200000, 96000, 3.0, '2024-02-18', '2024-02-25', 'Carlos Ramos', 'Juan Broker', 'Paid'),
(42, 'House and Lot in Porac', 'Porac, Pampanga', 5500000, 165000, 3.0, '2024-03-05', NULL, 'Miguel Torres', 'Juan Broker', 'Pending')
ON CONFLICT DO NOTHING;
