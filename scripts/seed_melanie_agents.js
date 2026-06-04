const { createClient } = require('@supabase/supabase-js');

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const brokerEmail = 'melanie@mliangrealty.com';

  const broker = {
    name: 'Melanie',
    email: brokerEmail,
    phone: '09170000000',
    status: 'Active',
    role: 'Broker',
    license_number: 'PRC-9000001',
  };

  let { data: existingBroker, error: fetchError } = await supabase
    .from('brokers')
    .select('id')
    .eq('email', brokerEmail)
    .maybeSingle();

  if (fetchError) {
    console.error('Failed to lookup Melanie broker:', fetchError);
    process.exit(1);
  }

  let brokerId;
  if (existingBroker) {
    brokerId = existingBroker.id;
    console.log('Found existing broker Melanie with id:', brokerId);
  } else {
    const { data: insertedBroker, error: insertError } = await supabase
      .from('brokers')
      .insert([broker])
      .select('id')
      .single();

    if (insertError || !insertedBroker) {
      console.error('Failed to create Melanie broker:', insertError);
      process.exit(1);
    }

    brokerId = insertedBroker.id;
    console.log('Created Melanie broker with id:', brokerId);
  }

  const agents = [
    { broker_id: brokerId, name: 'Agent One', email: 'agent.one@mliangrealty.com', phone: '09170000001', status: 'Active', license_number: 'PRC-100001' },
    { broker_id: brokerId, name: 'Agent Two', email: 'agent.two@mliangrealty.com', phone: '09170000002', status: 'Active', license_number: 'PRC-100002' },
    { broker_id: brokerId, name: 'Agent Three', email: 'agent.three@mliangrealty.com', phone: '09170000003', status: 'Active', license_number: 'PRC-100003' },
    { broker_id: brokerId, name: 'Agent Four', email: 'agent.four@mliangrealty.com', phone: '09170000004', status: 'Active', license_number: 'PRC-100004' },
    { broker_id: brokerId, name: 'Agent Five', email: 'agent.five@mliangrealty.com', phone: '09170000005', status: 'Active', license_number: 'PRC-100005' },
    { broker_id: brokerId, name: 'Agent Six', email: 'agent.six@mliangrealty.com', phone: '09170000006', status: 'Active', license_number: 'PRC-100006' },
    { broker_id: brokerId, name: 'Agent Seven', email: 'agent.seven@mliangrealty.com', phone: '09170000007', status: 'Active', license_number: 'PRC-100007' },
    { broker_id: brokerId, name: 'Agent Eight', email: 'agent.eight@mliangrealty.com', phone: '09170000008', status: 'Active', license_number: 'PRC-100008' },
    { broker_id: brokerId, name: 'Agent Nine', email: 'agent.nine@mliangrealty.com', phone: '09170000009', status: 'Active', license_number: 'PRC-100009' },
    { broker_id: brokerId, name: 'Agent Ten', email: 'agent.ten@mliangrealty.com', phone: '09170000010', status: 'Active', license_number: 'PRC-100010' },
  ];

  const { error: upsertError } = await supabase
    .from('agents')
    .upsert(agents, { onConflict: 'email' });

  if (upsertError) {
    console.error('Failed to upsert 10 agents:', upsertError);
    process.exit(1);
  }

  const { count, error: countError } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .eq('broker_id', brokerId);

  if (countError) {
    console.error('Failed to count agents for Melanie:', countError);
    process.exit(1);
  }

  console.log(`Seed complete. Melanie now has ${count} agents.`);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
