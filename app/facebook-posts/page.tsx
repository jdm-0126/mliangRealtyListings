'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/app/lib/supabaseClient.js'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Trash2, ExternalLink, Plus } from 'lucide-react'

export default function FacebookPostsPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    if (searchText) {
      const filtered = posts.filter(post =>
        post.messenger_name?.toLowerCase().includes(searchText.toLowerCase()) ||
        post.location?.toLowerCase().includes(searchText.toLowerCase()) ||
        post.price?.toLowerCase().includes(searchText.toLowerCase()) ||
        post.property_id?.toString().includes(searchText)
      )
      setFilteredPosts(filtered)
    } else {
      setFilteredPosts(posts)
    }
  }, [searchText, posts])

  const fetchPosts = async () => {
    if (!supabase) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('facebook_posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('Error fetching Facebook posts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this Facebook post?')) return

    if (!supabase) {
      alert('Database connection not available')
      return
    }

    try {
      const { error } = await supabase
        .from('facebook_posts')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      alert('Facebook post deleted successfully!')
      fetchPosts()
    } catch (error) {
      console.error('Error deleting Facebook post:', error)
      alert('Failed to delete Facebook post')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#000000' }}>Saved Facebook Posts</h2>
          <p style={{ color: '#4b5563' }}>View and manage your saved Facebook post contacts</p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex gap-2 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by messenger name, location, price, or property ID..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => window.open('/facebook-posts/add', '_self')} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Facebook Post
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/'}>
                Back to Dashboard
              </Button>
            </div>
            <div className="text-sm" style={{ color: '#4b5563' }}>
              Total: {filteredPosts.length} saved posts
            </div>
          </CardContent>
        </Card>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No saved Facebook posts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-1" style={{ color: '#000000' }}>
                        Property #{post.property_id > 2 ? post.property_id - 1 : post.property_id}
                      </h3>
                      <p className="text-sm" style={{ color: '#4b5563' }}>
                        {formatDate(post.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Messenger Name</p>
                      <p className="text-sm font-semibold" style={{ color: '#000000' }}>{post.messenger_name}</p>
                    </div>

                    {post.location && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Location</p>
                        <p className="text-sm" style={{ color: '#000000' }}>{post.location}</p>
                      </div>
                    )}

                    {post.price && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Price</p>
                        <p className="text-sm font-semibold text-green-600">{post.price}</p>
                      </div>
                    )}

                    {post.size && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Size</p>
                        <p className="text-sm" style={{ color: '#000000' }}>{post.size}</p>
                      </div>
                    )}

                    {post.facebook_url && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Facebook Post</p>
                        <a 
                          href={post.facebook_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          View Post
                        </a>
                      </div>
                    )}

                    {post.messenger_url && (
                      <div>
                        <p className="text-xs font-medium mb-1" style={{ color: '#6b7280' }}>Messenger</p>
                        <a 
                          href={post.messenger_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:underline break-all"
                        >
                          Contact Owner
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const displayId = post.property_id > 2 ? post.property_id - 1 : post.property_id
                        window.location.href = `/properties/${displayId}`
                      }}
                      className="flex-1"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View Property
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(post.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
