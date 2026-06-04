'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Settings, User, Database, Bell, Shield, Palette } from 'lucide-react'

const SETTINGS_KEY = 'tenantSettings'

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('Marquez Realty')
  const [brokerName, setBrokerName] = useState('Marquez Realty')
  const [brokerTitle, setBrokerTitle] = useState('Licensed Real Estate Broker')
  const [prcNumber, setPrcNumber] = useState('0019653')
  const [officeAddress, setOfficeAddress] = useState('S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga')
  const [contactNumber, setContactNumber] = useState('09393440944')
  const [emailAddress, setEmailAddress] = useState('contact@marquezrealty.com')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(SETTINGS_KEY) : null
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.businessName) setBusinessName(parsed.businessName)
        if (parsed.brokerName) setBrokerName(parsed.brokerName)
        if (parsed.brokerTitle) setBrokerTitle(parsed.brokerTitle)
        if (parsed.prcNumber) setPrcNumber(parsed.prcNumber)
        if (parsed.officeAddress) setOfficeAddress(parsed.officeAddress)
        if (parsed.contactNumber) setContactNumber(parsed.contactNumber)
        if (parsed.emailAddress) setEmailAddress(parsed.emailAddress)
      } catch {
        // ignore invalid stored settings
      }
    }
  }, [])

  const saveSettings = () => {
    const settings = {
      businessName,
      brokerName,
      brokerTitle,
      prcNumber,
      officeAddress,
      contactNumber,
      emailAddress,
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    localStorage.setItem('businessName', businessName)
    setSaved(true)
    window.dispatchEvent(new Event('storage'))
    window.setTimeout(() => setSaved(false), 2000)
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your application preferences and configuration</p>
        </div>

        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <User className="w-5 h-5 mr-2" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Business Name
                  </label>
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} style={{ color: '#000000' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Broker Name
                  </label>
                  <Input value={brokerName} onChange={(e) => setBrokerName(e.target.value)} style={{ color: '#000000' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Broker Title
                  </label>
                  <Input value={brokerTitle} onChange={(e) => setBrokerTitle(e.target.value)} style={{ color: '#000000' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    PRC License Number
                  </label>
                  <Input value={prcNumber} onChange={(e) => setPrcNumber(e.target.value)} style={{ color: '#000000' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Contact Number
                  </label>
                  <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} style={{ color: '#000000' }} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Email Address
                  </label>
                  <Input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} style={{ color: '#000000' }} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                  Office Address
                </label>
                <Input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} style={{ color: '#000000' }} />
              </div>
              <div className="flex items-center gap-3">
                <Button onClick={saveSettings}>Save Profile</Button>
                {saved && <span className="text-sm text-green-600">Profile saved</span>}
              </div>
            </CardContent>
          </Card>

          {/* Database Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Database Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-green-900">Supabase Connection</h3>
                  <p className="text-sm text-green-700">Connected and operational</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Table Name
                  </label>
                  <Input defaultValue="mlianglistings" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Records Count
                  </label>
                  <Input defaultValue="Loading..." disabled />
                </div>
              </div>
              <Button variant="outline">Test Connection</Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">New Property Alerts</h3>
                    <p className="text-sm text-gray-600">Get notified when new properties are added</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Status Updates</h3>
                    <p className="text-sm text-gray-600">Receive updates when property status changes</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Facebook Integration</h3>
                    <p className="text-sm text-gray-600">Enable Facebook posting features</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Session Timeout</h3>
                    <p className="text-sm text-gray-600">Automatically log out after inactivity</p>
                  </div>
                  <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                    <option>30 minutes</option>
                    <option>1 hour</option>
                    <option>2 hours</option>
                    <option>Never</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-medium mb-2">Theme</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Light</Button>
                    <Button variant="outline" size="sm">Dark</Button>
                    <Button variant="outline" size="sm">System</Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Default View</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Grid</Button>
                    <Button variant="outline" size="sm">List</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}