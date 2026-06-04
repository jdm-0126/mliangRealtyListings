'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Settings, User, Database, Bell, Shield, Palette, LogIn, LogOut, TrendingUp } from 'lucide-react'

const SETTINGS_KEY = 'tenantSettings'
const SUPERADMIN_EMAIL = 'jn16h7@gmail.com'
const SUPERADMIN_PASSWORD = 'EuandaiteD_0126'
const BROKER_PASSWORD = 'brokerMliangAdmin2026'

export default function SettingsPage() {
  const [businessName, setBusinessName] = useState('RealtyProv1')
  const [brokerName, setBrokerName] = useState('RealtyProv1')
  const [brokerTitle, setBrokerTitle] = useState('Licensed Real Estate Broker')
  const [prcNumber, setPrcNumber] = useState('0019653')
  const [officeAddress, setOfficeAddress] = useState('S10, 2nd Floor Plaza Cristina Building, Dolores, City of San Fernando, Pampanga')
  const [contactNumber, setContactNumber] = useState('09393440944')
  const [emailAddress, setEmailAddress] = useState('contact@RealtyProv1.com')
  const [saved, setSaved] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [userRole, setUserRole] = useState('')
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

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

    // Check login status
    const auth = sessionStorage.getItem('brokerAdminAuth')
    const email = sessionStorage.getItem('userEmail')
    if (auth === 'authenticated' && email) {
      setIsLoggedIn(true)
      setUserEmail(email)
      if (email === SUPERADMIN_EMAIL) {
        setUserRole('Superadmin')
      } else {
        setUserRole('Broker/Agent')
      }
    }
  }, [])

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Superadmin login
    if (loginEmail === SUPERADMIN_EMAIL && loginPassword === SUPERADMIN_PASSWORD) {
      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', loginEmail)
      sessionStorage.setItem('viewAsRole', 'superadmin')
      setIsLoggedIn(true)
      setUserEmail(loginEmail)
      setUserRole('Superadmin')
      setShowLoginForm(false)
      setLoginEmail('')
      setLoginPassword('')
      alert('Login successful as Superadmin!')
      return
    }
    
    // Broker/Admin login
    if (loginEmail && loginPassword === BROKER_PASSWORD) {
      sessionStorage.setItem('brokerAdminAuth', 'authenticated')
      sessionStorage.setItem('userEmail', loginEmail)
      sessionStorage.setItem('viewAsRole', 'broker')
      setIsLoggedIn(true)
      setUserEmail(loginEmail)
      setUserRole('Broker/Admin')
      setShowLoginForm(false)
      setLoginEmail('')
      setLoginPassword('')
      alert('Login successful as Broker/Admin!')
      return
    }
    
    alert('Invalid credentials. Use your email and the broker password.')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('brokerAdminAuth')
    sessionStorage.removeItem('userEmail')
    setIsLoggedIn(false)
    setUserEmail('')
    setUserRole('')
    alert('Logged out successfully!')
    window.location.reload()
  }

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
          {/* Login/Logout Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoggedIn ? (
                <div>
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg mb-4">
                    <div>
                      <h3 className="font-medium text-green-900">Logged In</h3>
                      <p className="text-sm text-green-700">Email: {userEmail}</p>
                      <p className="text-sm text-green-700">Role: {userRole}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <Button variant="destructive" onClick={handleLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              ) : (
                <div>
                  {showLoginForm ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                          Email
                        </label>
                        <Input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Enter your email"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                          Password
                        </label>
                        <Input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                          required
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="submit">
                          <LogIn className="w-4 h-4 mr-2" />
                          Login
                        </Button>
                        <Button variant="outline" onClick={() => setShowLoginForm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-4">Not logged in</p>
                      <Button onClick={() => setShowLoginForm(true)}>
                        <LogIn className="w-4 h-4 mr-2" />
                        Login
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
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
                  <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Broker Name
                  </label>
                  <Input value={brokerName} onChange={(e) => setBrokerName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Broker Title
                  </label>
                  <Input value={brokerTitle} onChange={(e) => setBrokerTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    PRC License Number
                  </label>
                  <Input value={prcNumber} onChange={(e) => setPrcNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Contact Number
                  </label>
                  <Input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                    Email Address
                  </label>
                  <Input type="email" value={emailAddress} onChange={(e) => setEmailAddress(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#000000' }}>
                  Office Address
                </label>
                <Input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} />
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
                    <h3 className="font-medium" style={{ color: '#000000' }}>New Property Alerts</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Get notified when new properties are added</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: '#000000' }}>Status Updates</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Receive updates when property status changes</p>
                  </div>
                  <input type="checkbox" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: '#000000' }}>Facebook Integration</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Enable Facebook posting features</p>
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
                    <h3 className="font-medium" style={{ color: '#000000' }}>Two-Factor Authentication</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Add an extra layer of security to your account</p>
                  </div>
                  <Button variant="outline" size="sm">Enable</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium" style={{ color: '#000000' }}>Session Timeout</h3>
                    <p className="text-sm" style={{ color: '#000000' }}>Automatically log out after inactivity</p>
                  </div>
                  <select className="px-3 py-1 border border-gray-300 rounded-md text-sm text-black">
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
                  <h3 className="font-medium mb-2" style={{ color: '#000000' }}>Theme</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Light</Button>
                    <Button variant="outline" size="sm">Dark</Button>
                    <Button variant="outline" size="sm">System</Button>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2" style={{ color: '#000000' }}>Default View</h3>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Grid</Button>
                    <Button variant="outline" size="sm">List</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                SEO Tips for Real Estate Listings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">

              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Use Location-Specific Keywords in Titles</h3>
                  <p className="text-sm text-gray-600">Include the city, barangay, or landmark in every listing title. Example: <span className="font-medium text-blue-700">"House and Lot for Sale near Clark, Mabalacat"</span> ranks better than just "House for Sale".</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Write Detailed Property Descriptions</h3>
                  <p className="text-sm text-gray-600">Describe the property fully — lot area, floor area, number of bedrooms/bathrooms, proximity to landmarks (school, hospital, highway). Longer, specific descriptions help search engines index your listing.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Add High-Quality Photos with Alt Text</h3>
                  <p className="text-sm text-gray-600">Upload clear photos of the property exterior, interior, and lot. Google Images can surface your listing. Name your images descriptively (e.g., <span className="font-medium text-blue-700">house-lot-san-fernando-pampanga.jpg</span>).</p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Optimize Your Facebook Posts with Hashtags</h3>
                  <p className="text-sm text-gray-600">Use relevant hashtags on every FB/IG/TikTok post. Include both general tags (<span className="font-medium">#realestate #forsale</span>) and local tags (<span className="font-medium">#Pampanga #SanFernando #ClarkArea</span>). This improves discoverability on social search.</p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">5</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Post Consistently Across Platforms</h3>
                  <p className="text-sm text-gray-600">Share listings on Facebook, Instagram, and TikTok regularly. Platforms reward consistent posters with better organic reach. Use Reels/TikTok videos for walkthroughs — video content gets 3× more engagement than photos.</p>
                </div>
              </div>

              {/* Step 6 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">6</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Include Price and Key Details in Post Copy</h3>
                  <p className="text-sm text-gray-600">Buyers search for listings with specific prices. Always include the price, lot/floor area, and number of bedrooms in the first few lines of your post. This also helps the platform algorithm match your post to the right audience.</p>
                </div>
              </div>

              {/* Step 7 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">7</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Register on Google Business Profile</h3>
                  <p className="text-sm text-gray-600">Create or claim your <span className="font-medium text-blue-700">Google Business Profile</span> (free). Add your business name, address, contact, photos, and listings. This makes you appear in local Google Search and Google Maps when buyers search "real estate agent Pampanga".</p>
                </div>
              </div>

              {/* Step 8 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">8</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Get Client Reviews and Testimonials</h3>
                  <p className="text-sm text-gray-600">Ask satisfied buyers/sellers to leave a Google review. More positive reviews boost your ranking in local search results. Even a few reviews can significantly improve trust and click-through rates.</p>
                </div>
              </div>

              {/* Step 9 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">9</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Cross-Link Between Your Listings</h3>
                  <p className="text-sm text-gray-600">When posting about one property, mention other nearby listings you have. Internal links (or mentions) keep buyers engaged and help search engines understand the breadth of your inventory in a specific area.</p>
                </div>
              </div>

              {/* Step 10 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">10</div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">Use a Consistent Brand Signature on Every Post</h3>
                  <p className="text-sm text-gray-600">Always end posts with your business name, broker name, PRC license number, and contact number. Consistent branding builds name recognition and helps buyers find you across platforms. Update your signature once in <span className="font-medium">Settings → Profile</span> and it applies everywhere automatically.</p>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 font-medium">💡 Quick Win</p>
                <p className="text-sm text-blue-700 mt-1">The single highest-impact action: post a <strong>short video walkthrough</strong> of a property on TikTok and Instagram Reels with the property address in the caption. Local video content consistently outperforms static posts for real estate in the Philippines.</p>
              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}