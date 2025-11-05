'use client';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import CrudTable from './CrudTable';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.from('mlianglistings').select('*');
    if (error) console.error('Error:', error);
    else setData(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>🏠 MLiang Realty</h1>
      {data.length === 0 ? (
        <p>No data found in mlianglistings table. Please add some records to your Supabase table.</p>
      ) : (
        <CrudTable data={data} onDataChange={fetchData} />
      )}
    </div>
  );
}