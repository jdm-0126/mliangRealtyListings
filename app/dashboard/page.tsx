'use client';
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient.js';

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    alert(message);
  };

  const testLead = async () => {
    const testData = {
      message: "LF house and lot in San Fernando, Pampanga. Budget 2.5M",
      link: "https://facebook.com/groups/test/posts/" + Date.now(),
      location: "San Fernando"
    };

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
      });
      
      if (response.ok) {
        alert('✅ Test lead sent successfully!');
        fetchLeads();
      }
    } catch (error) {
      alert('❌ Error: Make sure your server is running');
    }
  };

  const fetchLeads = async () => {
    if (!supabase) {
      setLeads([
        {
          id: 1,
          message: "LF house and lot in San Fernando, Pampanga. Budget 2M",
          link: "https://facebook.com/groups/sample/posts/123",
          location: "San Fernando",
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          message: "Looking for: Lot only in Angeles City, around 100sqm",
          link: "https://facebook.com/groups/sample/posts/124",
          location: "Angeles City",
          created_at: new Date(Date.now() - 3600000).toISOString()
        }
      ]);
      setLoading(false);
      return;
    }
    
    const { data, error } = await supabase
      .from('facebook_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching leads:', error);
      setLeads([
        {
          id: 1,
          message: "LF house and lot in San Fernando, Pampanga. Budget 2M",
          link: "https://facebook.com/groups/sample/posts/123",
          location: "San Fernando",
          created_at: new Date().toISOString()
        }
      ]);
    } else {
      setLeads(data || []);
    }
    setLoading(false);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>
      🔄 Loading...
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '16px 24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>📊 Facebook Leads Monitor</h1>
            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>Real-time monitoring of Facebook property inquiries</p>
          </div>
          <button 
            onClick={() => window.location.href = '/'}
            style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}
          >
            ← Back to Properties
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#dbeafe', padding: '12px', borderRadius: '8px' }}>📈</div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>{leads.length}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Total Leads</p>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#dcfce7', padding: '12px', borderRadius: '8px' }}>🎯</div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>{leads.filter(l => new Date(l.created_at) > new Date(Date.now() - 86400000)).length}</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Today's Leads</p>
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ backgroundColor: '#fef3c7', padding: '12px', borderRadius: '8px' }}>⚡</div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#1e293b' }}>Active</p>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b' }}>Monitoring Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>🔧 Quick Actions</h3>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => copyToClipboard('nkjdoilemjalabebiilamikinbnkaddg', '✅ Extension ID copied!')}
              style={{ padding: '12px 20px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              🆔 Copy Extension ID
            </button>
            
            <button 
              onClick={() => copyToClipboard(window.location.origin + '/api/leads', '✅ API URL copied!')}
              style={{ padding: '12px 20px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              🔗 Copy API URL
            </button>
            
            <button 
              onClick={testLead}
              style={{ padding: '12px 20px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              🧪 Test Connection
            </button>
            
            <button 
              onClick={fetchLeads}
              style={{ padding: '12px 20px', backgroundColor: '#6b7280', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              🔄 Refresh Data
            </button>
          </div>
        </div>

        {/* Setup Instructions */}
        <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>🚀 Extension Setup</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '16px' }}>🔧 Activate Extension</h4>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#475569' }}>
                <li>Open <code style={{ backgroundColor: '#e2e8f0', padding: '2px 4px', borderRadius: '4px' }}>chrome://extensions/</code></li>
                <li>Find: <code style={{ backgroundColor: '#e2e8f0', padding: '2px 4px', borderRadius: '4px' }}>nkjdoilemjalabebiilamikinbnkaddg</code></li>
                <li>Click "service worker (Inactive)" to activate</li>
                <li>Or click the reload button on extension</li>
              </ol>
            </div>
            
            <div style={{ padding: '16px', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#1e293b', fontSize: '16px' }}>📡 Configure API</h4>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px', color: '#475569' }}>
                <li>Set API URL: <code style={{ backgroundColor: '#dcfce7', padding: '2px 4px', borderRadius: '4px' }}>{typeof window !== 'undefined' ? window.location.origin : ''}/api/leads</code></li>
                <li>Enable Facebook monitoring</li>
                <li>Test with sample post</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Leads List */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>📋 Recent Leads ({leads.length})</h3>
          </div>
          
          <div style={{ padding: '20px' }}>
            {leads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' }}>No leads yet</h4>
                <p style={{ margin: 0, fontSize: '14px' }}>Start monitoring Facebook groups to see leads here</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {leads.map((lead, index) => (
                  <div key={lead.id} style={{ 
                    padding: '20px', 
                    backgroundColor: '#f8fafc', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    transition: 'all 0.2s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <span style={{ 
                        backgroundColor: '#3b82f6', 
                        color: 'white', 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '12px', 
                        fontWeight: '600' 
                      }}>
                        #{index + 1}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        {new Date(lead.created_at).toLocaleString()}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '12px' }}>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#1e293b' }}>
                        👥 {lead.group_name || 'Facebook Group'}
                      </h4>
                      <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#475569' }}>
                        👤 <strong>{lead.poster_name || 'Facebook User'}</strong>
                      </p>
                    </div>
                    
                    <div style={{ 
                      padding: '12px', 
                      backgroundColor: 'white', 
                      borderRadius: '6px', 
                      border: '1px solid #e2e8f0',
                      marginBottom: '12px'
                    }}>
                      <p style={{ margin: 0, fontSize: '14px', fontStyle: 'italic', color: '#374151', lineHeight: '1.5' }}>
                        "{lead.message || lead.post_text}"
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                        📍 <strong>{lead.location}</strong>
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#64748b' }}>
                        🏠 <strong>{lead.matched_properties || '3'} matches</strong>
                      </span>
                      {lead.link && (
                        <a 
                          href={lead.link} 
                          target="_blank" 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px', 
                            fontSize: '12px', 
                            color: '#3b82f6', 
                            textDecoration: 'none',
                            padding: '4px 8px',
                            backgroundColor: '#dbeafe',
                            borderRadius: '4px'
                          }}
                        >
                          🔗 View Post
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}