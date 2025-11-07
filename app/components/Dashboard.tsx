'use client';
import React, { useState, useCallback, useEffect } from 'react';
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
  const [sortBy, setSortBy] = useState('Property ID');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [pasteData, setPasteData] = useState('');

  // Location-based video URLs mapping
  const getVideoByLocation = (location: string) => {
    const videoMap: { [key: string]: string } = {
      'City of San Fernando': 'https://drive.google.com/file/d/YOUR_VIDEO_ID_1/view',
      'Angeles City': 'https://drive.google.com/file/d/YOUR_VIDEO_ID_2/view',
      'Mabalacat': 'https://drive.google.com/file/d/YOUR_VIDEO_ID_3/view',
      // Add more location-video mappings here
    };
    return videoMap[location] || '';
  };

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
    let filtered = data;
    if (searchText) {
      filtered = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchText.toLowerCase())
        )
      );
    }
    
    // Sort the filtered data
    filtered.sort((a, b) => {
      const aVal = sortBy === 'Property ID' ? Number(a[sortBy]) || 0 : String(a[sortBy] || '').toLowerCase();
      const bVal = sortBy === 'Property ID' ? Number(b[sortBy]) || 0 : String(b[sortBy] || '').toLowerCase();
      
      if (sortBy === 'Property ID') {
        return sortOrder === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      } else {
        return sortOrder === 'asc' ? (aVal as string).localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
      }
    });
    
    setFilteredData(filtered);
  }, [data, searchText, sortBy, sortOrder]);

  const columns = data.length > 0 ? Object.keys(data[0]).map(key => ({
    name: key,
    selector: (row: any) => key === 'Property ID' ? Number(row[key]) || 0 : row[key],
    sortable: false,
    wrap: true,
    omit: isMobile && !['Property ID', 'Village', 'Location'].includes(key),
    cell: (row: any): React.ReactNode => {
      if (key.toLowerCase().includes('photo') && row[key]) {
        return <a href={String(row[key])} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>Show photos</a>;
      }
      if (key.toLowerCase().includes('video') && row[key]) {
        return <a href={String(row[key])} target="_blank" rel="noopener noreferrer" style={{ color: '#28a745', textDecoration: 'underline' }}>Watch video</a>;
      }
      return key === 'Property ID' ? Number(row[key]) || 0 : String(row[key]);
    },
  })) : [];

  const parseExcelData = () => {
    if (!pasteData.trim()) return;
    const values = pasteData.split('\t');
    const keys = data.length > 0 ? Object.keys(data[0]) : [];
    const parsed: any = {};
    
    keys.forEach((key, index) => {
      if (values[index] && key !== 'Property ID') {
        parsed[key] = values[index].trim();
      }
    });
    
    setFormData((prev: any) => ({ ...prev, ...parsed }));
    setPasteData('');
  };

  const handleCreate = async () => {
    if (!supabase) return;
    const { error } = await supabase.from('mlianglistings').insert(formData);
    if (error) {
      alert('Record not added. Error: ' + error.message);
    } else {
      alert('Record successfully added!');
      setOpenDialog(false);
      setFormData({});
      fetchData();
    }
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
    const hasPhotos = Object.keys(row).some(key => key.toLowerCase().includes('photo') && row[key]);
    const hasVideo = Object.keys(row).some(key => key.toLowerCase().includes('video') && row[key]);
    
    let mediaInfo = '';
    if (hasPhotos && hasVideo) {
      mediaInfo = '\n\nPM for Photos and Video';
    } else if (hasPhotos) {
      mediaInfo = '\n\nPM for Photos';
    } else if (hasVideo) {
      mediaInfo = '\n\nPM for Video';
    }
    
    const text = `‼️HOUSE AND LOT FOR SALE‼️

📍${row.Village || ''},
📍${row.Location || ''},

🏷️${row['Listing Price'] || row.ListingPrice || row.Price || ''}

Lot Area : ${row['Lot Area'] || ''}
Floor Area : ${row['Floor Area'] || ''}

✔️ ${row.Notes || ''}

CGT - ${row.CGT || ''}
Transfer - ${row['Transfer Title'] || ''}

M. Liang Realty
LICENSED REAL ESTATE BROKER
PRC NO. 0019653
09393440944

#realestate #realtor #realtorlife #realestateagent #property #home #broker #forsale #justlisted #newlisting #listingagent #homesforsale #houseforsale #homeforsale #firsttimehomebuyer #homebuyers #househunting #newhome #dreamhome #homeownership #investmentproperty #homedecor #luxurylifestyle #luxuryhomes #homesweethome #SanFernando #Pampanga #Philippines${mediaInfo}`;
    
    navigator.clipboard.writeText(text);
    alert('Facebook post format copied to clipboard!');
  };

  const shareItem = (row: any) => {
    const text = Object.entries(row).map(([key, val]) => `${key}: ${val}`).join('\n');
    if (navigator.share) {
      navigator.share({ title: 'MLiang Listing', text });
    } else {
      copyToClipboard(row);
    }
  };

  const getGooglePhotoThumbnail = (url: string) => {
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
      if (fileId) {
        return `https://drive.google.com/thumbnail?id=${fileId[1]}&sz=w400`;
      }
    }
    return null;
  };

  const postToFacebook = (row: any) => {
    const hasPhotos = Object.keys(row).some(key => key.toLowerCase().includes('photo') && row[key]);
    const hasVideo = Object.keys(row).some(key => key.toLowerCase().includes('video') && row[key]);
    
    let mediaInfo = '';
    if (hasPhotos && hasVideo) {
      mediaInfo = '\n\nPM for Photos and Video';
    } else if (hasPhotos) {
      mediaInfo = '\n\nPM for Photos';
    } else if (hasVideo) {
      mediaInfo = '\n\nPM for Video';
    }
    
    const text = `‼️HOUSE AND LOT FOR SALE‼️

📍${row.Village || ''},
📍${row.Location || ''},

🏷️${row['Listing Price'] || row.ListingPrice || row.Price || ''}

Lot Area : ${row['Lot Area'] || ''}
Floor Area : ${row['Floor Area'] || ''}

✔️ ${row.Notes || ''}

CGT - ${row.CGT || ''}
Transfer - ${row['Transfer Title'] || ''}

M. Liang Realty
LICENSED REAL ESTATE BROKER
PRC NO. 0019653
09393440944

#realestate #realtor #realtorlife #realestateagent #property #home #broker #forsale #justlisted #newlisting #listingagent #homesforsale #houseforsale #homeforsale #firsttimehomebuyer #homebuyers #househunting #newhome #dreamhome #homeownership #investmentproperty #homedecor #luxurylifestyle #luxuryhomes #homesweethome #SanFernando #Pampanga #Philippines${mediaInfo}`;
    
    navigator.clipboard.writeText(text);
    
    // Get photo thumbnail for preview but don't include URL in post
    const photoField = Object.entries(row).find(([key, val]) => key.toLowerCase().includes('photo') && val);
    let fbUrl;
    
    if (photoField && photoField[1]) {
      const thumbnailUrl = getGooglePhotoThumbnail(String(photoField[1]));
      if (thumbnailUrl) {
        // Use thumbnail as preview image but don't include in post text
        fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(thumbnailUrl)}&quote=${encodeURIComponent(text)}`;
      } else {
        fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
      }
    } else {
      fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(text)}`;
    }
    
    window.open(fbUrl, '_blank', 'width=600,height=400');
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
            <button onClick={() => { setEditingRow(null); const maxId = Math.max(...data.map(row => Number(row['Property ID']) || 0), 0); setFormData({ 'Property ID': maxId + 1, Status: 'Active', Type: 'Residential', CGT: 'Seller', 'Transfer Title': 'Buyer', 'Lot Area': '100', 'Floor Area': '100', Location: 'City of San Fernando', Video: '', 'Listing Price': '' }); setPasteData(''); setOpenDialog(true); }} style={{ padding: '8px 12px', fontSize: '14px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px' }}>+ Add</button>
            <button onClick={() => window.location.href = '/upload'} style={{ padding: '8px 12px', fontSize: '14px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '4px' }}>📤 Upload</button>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ padding: '8px 12px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}>
              <option value="Property ID">Sort by ID</option>
              <option value="Village">Sort by Village</option>
              <option value="Location">Sort by Location</option>
              <option value="Type">Sort by Type</option>
            </select>
            <button onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')} style={{ padding: '8px 12px', fontSize: '14px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
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
            {searchText && (
              <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                Showing {filteredData.length} out of {data.length} records
              </p>
            )}
          </div>
          {isMobile ? (
            <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr' }}>
              {filteredData.map((row, i) => {
                const photoField = Object.entries(row).find(([key]) => key.toLowerCase().includes('photo'));
                const photoUrl = photoField ? photoField[1] : null;
                
                return (
                  <div key={row['Property ID'] || i} style={{ border: '1px solid #ddd', borderRadius: '6px', padding: '12px', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' }}>
                    
                    <div style={{ flex: 1 }}>
                      {Object.entries(row).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid #f0f0f0', wordBreak: 'break-word' }}>
                          <span style={{ fontWeight: '500', fontSize: '13px', color: '#666', minWidth: '80px' }}>{key}:</span>
                          <span style={{ fontSize: '13px', textAlign: 'right', marginLeft: '10px', flex: 1 }}>
                            {key.toLowerCase().includes('photo') && val ? (
                              <a href={String(val)} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'underline' }}>Show photos</a>
                            ) : key.toLowerCase().includes('video') && val ? (
                              <a href={String(val)} target="_blank" rel="noopener noreferrer" style={{ color: '#28a745', textDecoration: 'underline' }}>Watch video</a>
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
                      onClick={() => postToFacebook(row)}
                      style={{ flex: 1, padding: '6px 4px', backgroundColor: '#1877f2', color: 'white', border: 'none', borderRadius: '3px', fontSize: '11px', minHeight: '28px' }}
                    >
                      FB Post
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
                );
              })}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredData}
              selectableRows
              onSelectedRowsChange={({ selectedRows }) => setSelectedRows(selectedRows)}
              onRowDoubleClicked={(row) => { setEditingRow(row); setFormData({ ...row }); setOpenDialog(true); }}
              pagination={false}
              highlightOnHover
              striped
              responsive
            />
          )}
          {openDialog && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, padding: isMobile ? '5px' : '10px' }}>
              <div style={{ background: 'white', padding: isMobile ? '10px' : '15px', margin: isMobile ? '10px auto' : '50px auto', width: isMobile ? 'calc(100% - 10px)' : '500px', maxWidth: isMobile ? 'none' : '500px', maxHeight: isMobile ? 'calc(100vh - 20px)' : '90vh', overflow: 'auto', borderRadius: '8px' }}>
                <h3 style={{ marginBottom: isMobile ? '10px' : '15px', fontSize: isMobile ? '16px' : '18px', textAlign: 'center' }}>{editingRow ? 'Edit Property' : 'Add Property'}</h3>
                {!editingRow && (
                  <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f8f9fa' }}>
                    <label style={{ display: 'block', fontSize: '14px', marginBottom: '5px', fontWeight: '500' }}>Paste Excel Row (Tab-separated):</label>
                    <textarea
                      value={pasteData}
                      onChange={(e) => setPasteData(e.target.value)}
                      placeholder="Paste copied Excel row here..."
                      rows={2}
                      style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '14px', marginBottom: '8px' }}
                    />
                    <button
                      onClick={parseExcelData}
                      disabled={!pasteData.trim()}
                      style={{ padding: '6px 12px', backgroundColor: pasteData.trim() ? '#17a2b8' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px' }}
                    >
                      Parse Data
                    </button>
                  </div>
                )}
                <div style={{ display: 'grid', gap: isMobile ? '8px' : '10px' }}>
                  {data.length > 0 && Object.keys(data[0]).map(key => (
                    <div key={key}>
                      <label style={{ display: 'block', fontSize: isMobile ? '13px' : '14px', marginBottom: '4px', fontWeight: '500' }}>{key}:</label>
                      {key === 'Property ID' ? (
                        <input type="text" value={formData[key] || ''} disabled style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', backgroundColor: '#f0f0f0', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }} />
                      ) : key === 'Status' ? (
                        <select value={formData[key] || 'Draft'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Draft">Draft</option><option value="Active">Active</option></select>
                      ) : key === 'Type' ? (
                        <select value={formData[key] || 'Residential'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Residential">Residential</option><option value="Lot">Lot</option></select>
                      ) : key === 'CGT' ? (
                        <select value={formData[key] || 'Seller'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Seller">Seller</option><option value="Buyer">Buyer</option></select>
                      ) : key === 'Transfer Title' ? (
                        <select value={formData[key] || 'Buyer'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Buyer">Buyer</option><option value="Seller">Seller</option></select>
                      ) : key === 'Negotiable' ? (
                        <select value={formData[key] || 'Yes'} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ width: '100%', padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px' }}><option value="Yes">Yes</option><option value="No">No</option></select>
                      ) : key === 'Lot Area' || key === 'Floor Area' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, [key]: Math.max(0, (Number(prev[key]) || 0) - 1) }))} style={{ padding: '8px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px' }}>-</button>
                          <input type="number" value={formData[key] || 0} onChange={(e) => setFormData((prev: any) => ({ ...prev, [key]: e.target.value }))} style={{ flex: 1, padding: isMobile ? '12px 8px' : '8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: isMobile ? '16px' : '14px', textAlign: 'center' }} />
                          <button type="button" onClick={() => setFormData((prev: any) => ({ ...prev, [key]: (Number(prev[key]) || 0) + 1 }))} style={{ padding: '8px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px' }}>+</button>
                        </div>
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