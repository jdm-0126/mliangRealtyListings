-- Seed data for broker dashboard - sold properties with commissions
-- Run this after creating sold_properties table

INSERT INTO sold_properties (
    property_id, property_title, property_location, sale_price, 
    commission_amount, commission_percentage, date_sold, 
    date_commission_received, agent_name, broker_name, status, notes
) VALUES
-- Paid Commissions
(10, 'Modern 3BR House in San Fernando', 'San Fernando, Pampanga', 4500000, 135000, 3.0, '2024-01-15', '2024-01-20', 'Maria Santos', 'Juan Broker', 'Paid', 'Full commission received'),
(15, 'Commercial Lot 500sqm', 'Angeles City, Pampanga', 8000000, 240000, 3.0, '2024-01-22', '2024-02-01', 'Pedro Garcia', 'Juan Broker', 'Paid', 'Bank transfer completed'),
(35, 'Townhouse 2-Storey', 'Mabalacat, Pampanga', 3200000, 96000, 3.0, '2024-02-18', '2024-02-25', 'Carlos Ramos', 'Juan Broker', 'Paid', 'Cash payment'),
(48, 'Residential Lot 250sqm', 'Bacolor, Pampanga', 1800000, 54000, 3.0, '2023-12-10', '2023-12-20', 'Rosa Martinez', 'Juan Broker', 'Paid', 'End of year sale'),
(51, 'House and Lot 150sqm', 'Mexico, Pampanga', 2900000, 87000, 3.0, '2024-01-05', '2024-01-15', 'Miguel Torres', 'Juan Broker', 'Paid', 'Quick sale'),
(62, 'Duplex House', 'San Fernando, Pampanga', 5200000, 156000, 3.0, '2023-11-20', '2023-12-01', 'Isabel Santos', 'Juan Broker', 'Paid', 'Investment property'),

-- Pending Commissions
(22, 'Residential Lot in Gated Community', 'Mexico, Pampanga', 2500000, 75000, 3.0, '2024-02-10', NULL, 'Rosa Martinez', 'Juan Broker', 'Pending', 'Buyer completing requirements'),
(42, 'House and Lot 200sqm', 'Porac, Pampanga', 5500000, 165000, 3.0, '2024-03-05', NULL, 'Miguel Torres', 'Juan Broker', 'Pending', 'Awaiting title transfer'),
(55, 'Bungalow House', 'Mabalacat, Pampanga', 3800000, 114000, 3.0, '2024-03-12', NULL, 'Antonio Lopez', 'Juan Broker', 'Pending', 'Processing bank documents'),
(67, 'Commercial Building', 'Angeles City, Pampanga', 12000000, 360000, 3.0, '2024-03-18', NULL, 'Diego Morales', 'Juan Broker', 'Pending', 'Large transaction pending'),

-- Partial Payments
(73, 'Foreclosed Property', 'San Fernando, Pampanga', 3500000, 105000, 3.0, '2024-02-28', '2024-03-10', 'Elena Castillo', 'Juan Broker', 'Partial', 'Received 50% commission'),
(81, 'Vacation House', 'Porac, Pampanga', 4200000, 126000, 3.0, '2024-03-01', '2024-03-15', 'Sofia Cruz', 'Juan Broker', 'Partial', 'Installment basis'),

-- Recent Sales (Current Month)
(88, 'Luxury House 300sqm', 'Angeles City, Pampanga', 9500000, 285000, 3.0, '2024-03-20', NULL, 'Maria Santos', 'Juan Broker', 'Pending', 'High-value sale'),
(92, 'Apartment Complex', 'San Fernando, Pampanga', 15000000, 450000, 3.0, '2024-03-22', NULL, 'Pedro Garcia', 'Juan Broker', 'Pending', 'Multi-unit property'),
(98, 'House and Lot Corner Lot', 'Mexico, Pampanga', 4800000, 144000, 3.0, '2024-03-25', NULL, 'Carlos Ramos', 'Juan Broker', 'Pending', 'Premium location')

ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 
    status,
    COUNT(*) as count,
    SUM(commission_amount) as total_commission
FROM sold_properties
GROUP BY status
ORDER BY status;
