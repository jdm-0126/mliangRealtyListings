'use client';
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';
import DataTable from 'react-data-table-component';

export default function Dashboard() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [isMobile, setIsMobile] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filteredData, setFilteredData] = useState<any[]>([]);

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
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [fetchData]);

  useEffect(() => {
    if (!searchText) {
      setFilteredData(data);
    } else {
      const filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
      );
      setFilteredData(filtered);
    }
  }, [data, searchText]);

  const columns = data.length > 0 ? Object.keys(data[0]).map(key => ({
    name: key,
    selector: (row: any) => key === 'Property ID' ? Number(row[key]) || 0 : row[key],
    sortable: true,
    wrap: true,
    omit: isMobile && !['Property ID', 'Village', 'Location'].includes(key),
    cell: (row: any) => {
      if (key.toLowerCase().includes('photo') && row[key]) {
        return <a href={String(row[key])} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>Show photos</a>;
      }
      return key === 'Property ID' ? Number(row[key]) || 0 : String(row[key]);
    },
  })) : [];

  const handleCreate = async () => {
    if (!supabase) return;
    const maxId = Math.max(...data.map(row => Number(row['Property ID']) || 0), 0);
    const newData = { ...formData, 'Property ID': maxId + 1 };
    const { error } = await supabase.from('mlianglistings').insert(newData);
    if (error) alert(`Error: ${error.message}`);
    else { setOpenDialog(false); setFormData({}); fetchData(); }
  };

  const handleUpdate = async () => {
    if (!supabase) return;
    const { error } = await supabase
      .from('mlianglistings')
      .update(formData)
      .eq('Property ID', editingRow['Property ID']);
    if (error) alert(`Error: ${error.message}`);
    else { setOpenDialog(false); setEditingRow(null); setFormData({}); fetchData(); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete selected records?') || !supabase) return;
    for (const row of selectedRows) {
      await supabase.from('mlianglistings').delete().eq('Property ID', row['Property ID']);
    }
    setSelectedRows([]);
    fetchData();
  };

  const copyToClipboard = (row: any) => {
    const text = Object.entries(row).map(([key, val]) => `${key}: ${val}`).join('\n');
    navigator.clipboard.writeText(text);
    alert('Details copied to clipboard!');
  };

  const shareItem = (row: any) => {
    const text = Object.entries(row).map(([key, val]) => `${key}: ${val}`).join('\n');
    if (navigator.share) {
      navigator.share({ title: 'MLiang Listing', text });
    } else {
      copyToClipboard(row);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '10px', maxWidth: '100vw', overflow: 'hidden' }}>
      <h1 style={{ fontSize: isMobile ? '18px' : '24px', marginBottom: '15px' }}>🏠 MLiang Realty</h1>
      {data.length === 0 ? (
        <p>No data found. Please add records to your Supabase table.</p>
      ) : (
        <div>
          <div style={{ marginBottom: '15px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <button onClick={() => { setEditingRow(null); setFormData({ Status: 'Draft', Type: 'Residential', CGT: 'Seller', 'Transfer Title': 'Buyer' }); setOpenDialog(true); }} style={{ padding: '8px 12px', fontSize: '14px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>+ Add</button>
            {selectedRows.length === 1 && <button onClick={() => { setEditingRow(selectedRows[0]); setFormData({ ...selectedRows[0] }); setOpenDialog(true); }} style={{ padding: '8px 12px', fontSize: '14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Edit</button>}
            {selectedRows.length > 0 && <button onClick={handleDelete} style={{ padding: '8px 12px', fontSize: '14px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px' }}>Delete ({selectedRows.length})</button>}
          </div>
          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Search all fields..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
          </div>
          {isMobile ? (
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr' }}>
              {filteredData.map((row, i) => (
                <div key={row['Property ID'] || i} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ flex: 1 }}>
                    {Object.entries(row).map(([key, val]) => (
                      <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f0f0', wordBreak: 'break-word' }}>
                        <span style={{ fontWeight: '500', fontSize: '13px', color: '#666', minWidth: '80px' }}>{key}:</span>
                        <span style={{ fontSize: '13px', textAlign: 'right', marginLeft: '10px', flex: 1 }}>
                          {key.toLowerCase().includes('photo') && val ? (
                            <a href={String(val)} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>Show photos</a>
                          ) : (
                            String(val)
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: '3px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f0f0f0', flexShrink: 0 }}>
                    <button
                      onClick={() => { setEditingRow(row); setFormData({ ...row }); setOpenDialog(true); }}
                      style={{ flex: 1, padding: '6px 4px', backgroundColor: '#ff6b35', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', minHeight: '28px' }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => copyToClipboard(row)}
                      style={{ flex: 1, padding: '6px 4px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', minHeight: '28px' }}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => shareItem(row)}
                      style={{ flex: 1, padding: '6px 4px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', minHeight: '28px' }}
                    >
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              selectableRows
              onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
              onRowDoubleClicked={(row) => { setEditingRow(row); setFormData({ ...row }); setOpenDialog(true); }}
              pagination
              paginationPerPage={10}
              paginationRowsPerPageOptions={[10, 25, 50]}
              highlightOnHover
              striped
              responsive
            />
          )}
          {openDialog && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: isMobile ? '5px' : '10px' }}>
              <div style={{ background: 'white', padding: isMobile ? '10px' : '15px', margin: isMobile ? '10px auto' : '50px auto', width: isMobile ? 'calc(100% - 10px)' : '500px', maxWidth: isMobile ? 'none' : '500px', maxHeight: isMobile ? 'calc(100vh - 20px)' : '90vh', overflow: 'auto', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: isMobile ? '10px' : '15px', fontSize: isMobile ? '16px' : '18px', textAlign: 'center' }}>{editingRow ? 'Edit Property' : 'Add Property'}</h3>
                <div style={{ display: 'grid', gap: isMobile ? '8px' : '10px' }}>
                  {data.length > 0 && Object.keys(data[0]).map(key => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: isMobile ? '13px' : '14px', marginBottom: '4px', fontWeight: '500' }}>{key}:</label>
                      {key === 'Property ID' && editingRow ? (
                        <input type="text" value={formData[key] || ''} disabled style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }} />
                      ) : key === 'Status' ? (
                        <select value={formData[key] || 'Draft'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Draft">Draft</option><option value="Active">Active</option></select>
                      ) : key === 'Type' ? (
                        <select value={formData[key] || 'Residential'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Residential">Residential</option><option value="Lot">Lot</option></select>
                      ) : key === 'CGT' ? (
                        <select value={formData[key] || 'Seller'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Seller">Seller</option><option value="Buyer">Buyer</option></select>
                      ) : key === 'Transfer Title' ? (
                        <select value={formData[key] || 'Buyer'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Buyer">Buyer</option><option value="Seller">Seller</option></select>
                      ) : key === 'Notes' ? (
                        <textarea value={formData[key] || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} rows={isMobile ? 2 : 3} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical', fontSize: isMobile ? '16px' : '14px' }} />
                      ) : (
                        <input type="text" value={formData[key] || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }} />
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: isMobile ? '15px' : '20px', display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setOpenDialog(false); setEditingRow(null); setFormData({}); }} style={{ flex: 1, padding: isMobile ? '14px 10px' : '10px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}>Cancel</button>
                  <button onClick={editingRow ? handleUpdate : handleCreate} style={{ flex: 1, padding: isMobile ? '14px 10px' : '10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}>{editingRow ? 'Update' : 'Create'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}