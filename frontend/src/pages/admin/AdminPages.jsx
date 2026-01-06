import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const AdminPages = () => {
  const [pages, setPages] = useState([])
  const [selectedPage, setSelectedPage] = useState(null)
  const [editingSection, setEditingSection] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchPages()
  }, [])

  const fetchPages = async () => {
    try {
      const res = await api.get('/admin/pages')
      setPages(res.data)
      
      // Initialize default pages if none exist
      if (res.data.length === 0) {
        await initializeDefaultPages()
      }
    } catch (error) {
      console.error('Error fetching pages:', error)
      toast.error('Failed to fetch pages')
    } finally {
      setLoading(false)
    }
  }

  const initializeDefaultPages = async () => {
    const defaultPages = [
      {
        slug: 'home',
        title: 'Home Page',
        sections: [
          {
            id: 'hero-1',
            type: 'hero',
            title: 'Discover Your Next Favorite Product',
            content: 'Find unique items and great deals at Find Store',
            backgroundColor: '#FF385C',
            textColor: '#FFFFFF',
            fontSize: '4xl',
            alignment: 'center',
            order: 0,
            visible: true
          }
        ],
        published: true
      },
      {
        slug: 'about',
        title: 'About Page',
        sections: [
          {
            id: 'text-1',
            type: 'text',
            title: 'Our Story',
            content: 'Find Store was founded with a simple vision...',
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            fontSize: 'lg',
            alignment: 'left',
            order: 0,
            visible: true
          }
        ],
        published: true
      },
      {
        slug: 'contact',
        title: 'Contact Page',
        sections: [
          {
            id: 'text-1',
            type: 'text',
            title: 'Contact Us',
            content: 'Get in touch with us!',
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
            fontSize: 'lg',
            alignment: 'center',
            order: 0,
            visible: true
          }
        ],
        published: true
      }
    ]

    try {
      for (const page of defaultPages) {
        await api.post('/admin/pages', page)
      }
      fetchPages()
    } catch (error) {
      console.error('Error initializing pages:', error)
    }
  }

  const handleSelectPage = async (pageSlug) => {
    try {
      const res = await api.get(`/admin/pages/${pageSlug}`)
      setSelectedPage(res.data)
    } catch (error) {
      console.error('Error fetching page:', error)
      toast.error('Failed to load page')
    }
  }

  const handleSavePage = async () => {
    if (!selectedPage) return

    setSaving(true)
    try {
      await api.put(`/admin/pages/${selectedPage._id}`, selectedPage)
      toast.success('Page saved successfully!')
      fetchPages()
    } catch (error) {
      console.error('Error saving page:', error)
      toast.error('Failed to save page')
    } finally {
      setSaving(false)
    }
  }

  const handleAddSection = () => {
    if (!selectedPage) return

    const newSection = {
      id: `section-${Date.now()}`,
      type: 'text',
      title: 'New Section',
      content: 'Add your content here...',
      backgroundColor: '#FFFFFF',
      textColor: '#000000',
      fontSize: 'lg',
      alignment: 'left',
      order: selectedPage.sections.length,
      visible: true,
      styles: {}
    }

    setSelectedPage({
      ...selectedPage,
      sections: [...selectedPage.sections, newSection]
    })
  }

  const handleDeleteSection = (sectionId) => {
    if (!selectedPage) return

    setSelectedPage({
      ...selectedPage,
      sections: selectedPage.sections.filter(s => s.id !== sectionId)
    })
  }

  const handleUpdateSection = (sectionId, updates) => {
    if (!selectedPage) return

    setSelectedPage({
      ...selectedPage,
      sections: selectedPage.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      )
    })
  }

  const handleImageUpload = async (sectionId, file) => {
    if (!selectedPage || !file) return

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await api.post('/admin/upload', formData)

      handleUpdateSection(sectionId, { image: res.data.imageUrl })
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to upload image')
    }
  }

  const handleImageUrlChange = (sectionId, url) => {
    if (!selectedPage) return
    handleUpdateSection(sectionId, { image: url })
  }

  const handleBackgroundImageUpload = async (sectionId, file) => {
    if (!selectedPage || !file) return

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await api.post('/admin/upload', formData)

      handleUpdateSection(sectionId, { backgroundImage: res.data.imageUrl })
      toast.success('Background image uploaded successfully!')
    } catch (error) {
      console.error('Error uploading background image:', error)
      toast.error('Failed to upload background image')
    }
  }

  const handleBackgroundImageUrlChange = (sectionId, url) => {
    if (!selectedPage) return
    handleUpdateSection(sectionId, { backgroundImage: url })
  }

  if (loading) {
    return (
      <AdminLayout title="Page Settings">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C]"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Page Settings">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pages List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Pages</h2>
              <button
                onClick={() => setSelectedPage(null)}
                className="text-sm text-[#FF385C] hover:text-[#E61E4D]"
              >
                New Page
              </button>
            </div>
            <div className="space-y-2">
              {pages.map((page) => (
                <button
                  key={page._id}
                  onClick={() => handleSelectPage(page.slug)}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    selectedPage?._id === page._id
                      ? 'bg-[#FF385C] text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="font-semibold">{page.title}</div>
                  <div className="text-sm opacity-75">/{page.slug}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Page Editor */}
        <div className="lg:col-span-2">
          {selectedPage ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedPage.title}</h2>
                  <p className="text-sm text-gray-500">/{selectedPage.slug}</p>
                </div>
                <button
                  onClick={handleSavePage}
                  disabled={saving}
                  className="bg-[#FF385C] hover:bg-[#E61E4D] text-white px-6 py-2 rounded-lg font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Page'}
                </button>
              </div>

              {/* Sections List */}
              <div className="space-y-4 mb-6">
                {selectedPage.sections.map((section, index) => (
                  <div
                    key={section.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-[#FF385C] transition-colors"
                  >
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">
                          Section {index + 1}: {section.type}
                        </span>
                        {!section.visible && (
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                            Hidden
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingSection(editingSection === section.id ? null : section.id)}
                          className="text-sm text-[#FF385C] hover:text-[#E61E4D]"
                        >
                          {editingSection === section.id ? 'Close' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDeleteSection(section.id)}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {editingSection === section.id && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        {/* Section Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Section Type
                          </label>
                          <select
                            value={section.type}
                            onChange={(e) => handleUpdateSection(section.id, { type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                          >
                            <option value="hero">Hero</option>
                            <option value="text">Text</option>
                            <option value="image">Image</option>
                            <option value="gallery">Gallery</option>
                            <option value="features">Features</option>
                            <option value="cta">Call to Action</option>
                            <option value="custom">Custom</option>
                          </select>
                        </div>

                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={section.title || ''}
                            onChange={(e) => handleUpdateSection(section.id, { title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                            placeholder="Section title"
                          />
                        </div>

                        {/* Content */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Content
                          </label>
                          <textarea
                            value={section.content || ''}
                            onChange={(e) => handleUpdateSection(section.id, { content: e.target.value })}
                            rows="4"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                            placeholder="Section content"
                          />
                        </div>

                        {/* Image Upload */}
                        {(section.type === 'image' || section.type === 'hero' || section.type === 'gallery') && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Image
                            </label>
                            
                            {/* Local File Upload */}
                            <div className="mb-3">
                              <label className="block text-xs text-gray-600 mb-1">Upload from computer:</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleImageUpload(section.id, e.target.files[0])
                                    e.target.value = '' // Reset input
                                  }
                                }}
                                className="block w-full text-sm text-gray-500
                                  file:mr-4 file:py-2 file:px-4
                                  file:rounded-md file:border-0
                                  file:text-sm file:font-semibold
                                  file:bg-blue-50 file:text-blue-700
                                  hover:file:bg-blue-100"
                              />
                            </div>

                            {/* URL Input */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">Or enter image URL:</label>
                              <div className="flex gap-2">
                                <input
                                  type="url"
                                  value={section.image || ''}
                                  onChange={(e) => handleImageUrlChange(section.id, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                                  placeholder="https://example.com/image.jpg"
                                />
                                {section.image && (
                                  <button
                                    type="button"
                                    onClick={() => handleImageUrlChange(section.id, '')}
                                    className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Image Preview */}
                            {section.image && (
                              <div className="mt-3">
                                <img
                                  src={section.image}
                                  alt="Section preview"
                                  className="w-full h-48 object-cover rounded-md border border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = 'none'
                                    const errorDiv = e.target.nextSibling
                                    if (errorDiv) errorDiv.style.display = 'block'
                                  }}
                                />
                                <div className="hidden text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">
                                  Failed to load image. Please check the URL.
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Background Image */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Background Image
                          </label>
                          
                          {/* Local File Upload */}
                          <div className="mb-3">
                            <label className="block text-xs text-gray-600 mb-1">Upload from computer:</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handleBackgroundImageUpload(section.id, e.target.files[0])
                                  e.target.value = '' // Reset input
                                }
                              }}
                              className="block w-full text-sm text-gray-500
                                file:mr-4 file:py-2 file:px-4
                                file:rounded-md file:border-0
                                file:text-sm file:font-semibold
                                file:bg-blue-50 file:text-blue-700
                                hover:file:bg-blue-100"
                            />
                          </div>

                          {/* URL Input */}
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Or enter image URL:</label>
                            <div className="flex gap-2">
                              <input
                                type="url"
                                value={section.backgroundImage || ''}
                                onChange={(e) => handleBackgroundImageUrlChange(section.id, e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C] text-sm"
                                placeholder="https://example.com/background.jpg"
                              />
                              {section.backgroundImage && (
                                <button
                                  type="button"
                                  onClick={() => handleBackgroundImageUrlChange(section.id, '')}
                                  className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200 text-sm font-medium"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Background Image Preview */}
                          {section.backgroundImage && (
                            <div className="mt-3">
                              <img
                                src={section.backgroundImage}
                                alt="Background preview"
                                className="w-full h-32 object-cover rounded-md border border-gray-200"
                                onError={(e) => {
                                  e.target.style.display = 'none'
                                  const errorDiv = e.target.nextSibling
                                  if (errorDiv) errorDiv.style.display = 'block'
                                }}
                              />
                              <div className="hidden text-red-500 text-sm mt-2 p-2 bg-red-50 rounded">
                                Failed to load background image. Please check the URL.
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Background Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Background Color (used if no background image)
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={section.backgroundColor || '#FFFFFF'}
                              onChange={(e) => handleUpdateSection(section.id, { backgroundColor: e.target.value })}
                              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={section.backgroundColor || '#FFFFFF'}
                              onChange={(e) => handleUpdateSection(section.id, { backgroundColor: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                              placeholder="#FFFFFF"
                            />
                          </div>
                        </div>

                        {/* Text Color */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Color
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={section.textColor || '#000000'}
                              onChange={(e) => handleUpdateSection(section.id, { textColor: e.target.value })}
                              className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                            />
                            <input
                              type="text"
                              value={section.textColor || '#000000'}
                              onChange={(e) => handleUpdateSection(section.id, { textColor: e.target.value })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                              placeholder="#000000"
                            />
                          </div>
                        </div>

                        {/* Font Size */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Font Size
                          </label>
                          <select
                            value={section.fontSize || 'lg'}
                            onChange={(e) => handleUpdateSection(section.id, { fontSize: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                          >
                            <option value="xs">Extra Small</option>
                            <option value="sm">Small</option>
                            <option value="base">Base</option>
                            <option value="lg">Large</option>
                            <option value="xl">Extra Large</option>
                            <option value="2xl">2X Large</option>
                            <option value="3xl">3X Large</option>
                            <option value="4xl">4X Large</option>
                          </select>
                        </div>

                        {/* Alignment */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Alignment
                          </label>
                          <select
                            value={section.alignment || 'left'}
                            onChange={(e) => handleUpdateSection(section.id, { alignment: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#FF385C]"
                          >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                          </select>
                        </div>

                        {/* Visibility Toggle */}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={section.visible !== false}
                            onChange={(e) => handleUpdateSection(section.id, { visible: e.target.checked })}
                            className="w-4 h-4 text-[#FF385C] border-gray-300 rounded focus:ring-[#FF385C]"
                          />
                          <label className="text-sm font-medium text-gray-700">
                            Visible on page
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Section Preview */}
                    {editingSection !== section.id && (
                      <div
                        className="mt-3 p-4 rounded"
                        style={{
                          backgroundColor: section.backgroundImage ? 'transparent' : (section.backgroundColor || '#FFFFFF'),
                          backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : 'none',
                          backgroundSize: section.backgroundImage ? 'cover' : 'auto',
                          backgroundPosition: section.backgroundImage ? 'center' : 'auto',
                          backgroundRepeat: section.backgroundImage ? 'no-repeat' : 'repeat',
                          color: section.textColor || '#000000',
                          textAlign: section.alignment || 'left',
                          minHeight: section.backgroundImage ? '200px' : 'auto'
                        }}
                      >
                        <h3 className={`font-bold mb-2 text-${section.fontSize || 'lg'}`}>
                          {section.title || 'Untitled Section'}
                        </h3>
                        <p className="text-sm">{section.content || 'No content'}</p>
                        {section.image && (
                          <img
                            src={section.image}
                            alt={section.title}
                            className="mt-2 w-full h-32 object-cover rounded"
                          />
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleAddSection}
                className="w-full border-2 border-dashed border-gray-300 hover:border-[#FF385C] text-gray-600 hover:text-[#FF385C] py-4 rounded-lg transition-colors"
              >
                + Add New Section
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-500 text-lg">Select a page from the list to start editing</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminPages

