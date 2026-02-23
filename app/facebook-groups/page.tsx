'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Users, MessageCircle, TrendingUp, Calendar, ExternalLink } from 'lucide-react'

export default function FacebookGroupsPage() {
  const groups = [
    {
      id: 1,
      name: 'San Fernando Pampanga Real Estate',
      members: '12.5K',
      status: 'Active',
      lastPost: '2 hours ago',
      engagement: 'High',
      description: 'Buy and sell properties in San Fernando, Pampanga'
    },
    {
      id: 2,
      name: 'Angeles City Properties',
      members: '8.2K',
      status: 'Active',
      lastPost: '5 hours ago',
      engagement: 'Medium',
      description: 'Real estate listings and discussions for Angeles City'
    },
    {
      id: 3,
      name: 'Pampanga House and Lot',
      members: '15.8K',
      status: 'Pending',
      lastPost: 'Never',
      engagement: 'Low',
      description: 'House and lot for sale in Pampanga province'
    }
  ]

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'success'
      case 'pending': return 'warning'
      case 'inactive': return 'secondary'
      default: return 'default'
    }
  }

  const getEngagementVariant = (engagement: string) => {
    switch (engagement.toLowerCase()) {
      case 'high': return 'success'
      case 'medium': return 'warning'
      case 'low': return 'destructive'
      default: return 'default'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Facebook Groups</h1>
          <p className="text-gray-600">Manage your Facebook group memberships and posting schedule</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Groups</p>
                  <p className="text-2xl font-bold text-gray-900">{groups.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-50 rounded-lg">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Groups</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {groups.filter(g => g.status === 'Active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Reach</p>
                  <p className="text-2xl font-bold text-gray-900">36.5K</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Calendar className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Posts This Week</p>
                  <p className="text-2xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Groups List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Facebook Groups</CardTitle>
              <Button>
                <Users className="w-4 h-4 mr-2" />
                Join New Group
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {groups.map((group) => (
                <div key={group.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{group.name}</h3>
                        <Badge variant={getStatusVariant(group.status)}>
                          {group.status}
                        </Badge>
                        <Badge variant={getEngagementVariant(group.engagement)}>
                          {group.engagement} Engagement
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{group.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">{group.members} members</span>
                        </div>
                        <div className="flex items-center">
                          <MessageCircle className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">Last post: {group.lastPost}</span>
                        </div>
                        <div className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">{group.engagement} engagement</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Visit
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Post
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Posting Schedule */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Posting Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Optimal Posting Times</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Monday - Friday:</span>
                      <span className="font-medium">9:00 AM, 1:00 PM, 7:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Saturday - Sunday:</span>
                      <span className="font-medium">10:00 AM, 3:00 PM, 8:00 PM</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Next Scheduled Posts</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Property #123 - San Fernando</span>
                      <span className="text-gray-600">Today, 1:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Property #124 - Angeles City</span>
                      <span className="text-gray-600">Tomorrow, 9:00 AM</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule New Post
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}