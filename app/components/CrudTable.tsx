'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

interface CrudTableProps {
  data: any[];
  onDataChange: () => void;
}

export default function CrudTable({ data, onDataChange }: CrudTableProps) {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRow, setEditingRow] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [filters, setFilters] = useState<{[key: string]: string}>({});
  const [sortConfig, setSortConfig] = useState<{column: string, direction: 'asc' | 'desc'} | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const filteredData = data.filter(row => {
    return Object.keys(filters).every(column => {
      if (!filters[column]) return true;
      return String(row[column] || '').toLowerCase().includes(filters[column].toLowerCase());
    });
  }).sort((a, b) => {
    if (!sortConfig) return 0;
    const { column, direction } = sortConfig;
    const aVal = column === 'Property ID' ? Number(a[column]) || 0 : String(a[column] || '').toLowerCase();
    const bVal = column === 'Property ID' ? Number(b[column]) || 0 : String(b[column] || '').toLowerCase();
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  const openCreateDialog = () => {
    setEditingRow(null);
    setFormData({
      Status: 'Draft',
      Type: 'Residential',
      CGT: 'Seller',
      'Transfer Title': 'Buyer'
    });
    setOpenDialog(true);
  };

  const openEditDialog = (row: any) => {
    setEditingRow(row);
    setFormData({ ...row });
    setOpenDialog(true);
  };

  const closeDialog = () => {
    setOpenDialog(false);
    setEditingRow(null);
    setFormData({});
  };

  const handleCreate = async () => {
    if (!supabase) {
      alert('Supabase client not initialized');
      return;
    }
    const maxId = Math.max(...data.map(row => Number(row['Property ID']) || 0), 0);
    const newData = { ...formData, 'Property ID': maxId + 1 };
    const { error } = await supabase.from('mlianglistings').insert(newData);
    if (error) alert(`Error: ${error.message}`);
    else { closeDialog(); onDataChange(); }
  };

  const handleUpdate = async () => {
    if (!supabase) {
      alert('Supabase client not initialized');
      return;
    }
    const { error } = await supabase
      .from('mlianglistings')
      .update(formData)
      .eq('Property ID', editingRow['Property ID']);
    if (error) alert(`Error: ${error.message}`);
    else { closeDialog(); onDataChange(); }
  };

  const handleDelete = async (row: any) => {
    if (!confirm('Delete this record?')) return;
    if (!supabase) {
      alert('Supabase client not initialized');
      return;
    }
    const { error } = await supabase
      .from('mlianglistings')
      .delete()
      .eq('Property ID', row['Property ID']);
    if (error) alert(`Error: ${error.message}`);
    else onDataChange();
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(filteredData.map(row => row['Property ID'])))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleRowSelect = (propertyId: number, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(propertyId)
    } else {
      newSelected.delete(propertyId)
    }
    setSelectedRows(newSelected)
  }

  return (
    <div>
      <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
        <button onClick={openCreateDialog}>Add Property</button>
        {selectedRows.size === 1 && (
          <button onClick={() => {
            const selectedId = Array.from(selectedRows)[0]
            const selectedRow = filteredData.find(row => row['Property ID'] === selectedId)
            if (selectedRow) openEditDialog(selectedRow)
          }} style={{ backgroundColor: '#28a745', color: 'white' }}>
            Edit Selected
          </button>
        )}
      </div>
      
      <table>
        <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10 }}>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={filteredData.length > 0 && selectedRows.size === filteredData.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </th>
            {data.length > 0 && Object.keys(data[0]).map(column => (
              <th key={column}>
                <div 
                  onClick={() => {
                    if (['Property ID', 'Village', 'Location'].includes(column)) {
                      setSortConfig(prev => 
                        prev?.column === column && prev.direction === 'asc' 
                          ? { column, direction: 'desc' }
                          : { column, direction: 'asc' }
                      );
                    }
                  }}
                  style={{
                    cursor: ['Property ID', 'Village', 'Location'].includes(column) ? 'pointer' : 'default',
                    userSelect: 'none'
                  }}
                >
                  {column}
                  {sortConfig?.column === column && (
                    <span style={{ marginLeft: '5px' }}>
                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={`Filter ${column}`}
                  value={filters[column] || ''}
                  onChange={(e) => setFilters((prev: {[key: string]: string}) => ({ ...prev, [column]: e.target.value }))}
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </th>
            ))}
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map(row => (
            <tr 
              key={row['Property ID']}
              style={{ 
                backgroundColor: selectedRows.has(row['Property ID']) ? '#e3f2fd' : 'transparent'
              }}
            >
              <td>
                <input
                  type="checkbox"
                  checked={selectedRows.has(row['Property ID'])}
                  onChange={(e) => handleRowSelect(row['Property ID'], e.target.checked)}
                />
              </td>
              {Object.keys(row).map(column => (
                <td key={column} style={column === 'Notes' ? { textAlign: 'left', whiteSpace: 'pre-wrap' } : {}}>
                  {row[column]}
                </td>
              ))}
              <td>
                <button onClick={() => openEditDialog(row)}>Edit</button>
                <button onClick={() => handleDelete(row)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openDialog && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: 'white', padding: '20px', margin: '50px auto', width: '500px' }}>
            <h3>{editingRow ? 'Edit Property' : 'Add Property'}</h3>
            
            {editingRow && (
              <div>
                <label>Property ID:</label>
                <input
                  type="text"
                  value={formData['Property ID'] || ''}
                  disabled
                  style={{ backgroundColor: '#f0f0f0' }}
                />
              </div>
            )}

            <div>
              <label>Village (required):</label>
              <input
                type="text"
                value={formData.Village || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, Village: e.target.value }))}
                required
              />
            </div>

            <div>
              <label>Location (required):</label>
              <input
                type="text"
                value={formData.Location || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, Location: e.target.value }))}
                required
              />
            </div>

            <div>
              <label>Status:</label>
              <select
                value={formData.Status || 'Draft'}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, Status: e.target.value }))}
              >
                <option value="Draft">Draft</option>
                <option value="Active">Active</option>
              </select>
            </div>

            <div>
              <label>Type:</label>
              <select
                value={formData.Type || 'Residential'}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, Type: e.target.value }))}
              >
                <option value="Residential">Residential</option>
                <option value="Lot">Lot</option>
              </select>
            </div>

            <div>
              <label>CGT:</label>
              <select
                value={formData.CGT || 'Seller'}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, CGT: e.target.value }))}
              >
                <option value="Seller">Seller</option>
                <option value="Buyer">Buyer</option>
              </select>
            </div>

            <div>
              <label>Transfer Title:</label>
              <select
                value={formData['Transfer Title'] || 'Buyer'}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, 'Transfer Title': e.target.value }))}
              >
                <option value="Buyer">Buyer</option>
                <option value="Seller">Seller</option>
              </select>
            </div>

            <div>
              <label>Listing Agent (required):</label>
              <input
                type="text"
                value={formData['Listing Agent'] || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, 'Listing Agent': e.target.value }))}
                required
              />
            </div>

            <div>
              <label>Notes:</label>
              <textarea
                value={formData.Notes || ''}
                onChange={(e) => setFormData((prev: any) => ({ ...prev, Notes: e.target.value }))}
                rows={4}
                style={{ width: '100%' } as React.CSSProperties}
              />
            </div>

            <div>
              <button onClick={closeDialog}>Cancel</button>
              <button onClick={editingRow ? handleUpdate : handleCreate}>
                {editingRow ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}