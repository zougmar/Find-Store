import { useState, useEffect } from 'react'
import api from '../utils/api'

const PageRenderer = ({ slug, fallback }) => {
  const [page, setPage] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPage()
  }, [slug])

  const fetchPage = async () => {
    try {
      const res = await api.get(`/pages/${slug}`)
      setPage(res.data)
    } catch (error) {
      console.error('Error fetching page:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return fallback || <div>Loading...</div>
  }

  if (!page || !page.published) {
    return fallback || null
  }

  const renderSection = (section) => {
    if (!section.visible) return null

    const sectionStyle = {
      backgroundColor: section.backgroundImage ? 'transparent' : (section.backgroundColor || '#FFFFFF'),
      backgroundImage: section.backgroundImage ? `url(${section.backgroundImage})` : 'none',
      backgroundSize: section.backgroundImage ? 'cover' : 'auto',
      backgroundPosition: section.backgroundImage ? 'center' : 'auto',
      backgroundRepeat: section.backgroundImage ? 'no-repeat' : 'repeat',
      color: section.textColor || '#000000',
      textAlign: section.alignment || 'left',
      padding: '2rem',
      marginBottom: '1rem',
      position: 'relative',
      minHeight: section.backgroundImage ? '400px' : 'auto'
    }

    const fontSizeMap = {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    }

    const titleStyle = {
      fontSize: fontSizeMap[section.fontSize] || fontSizeMap.lg,
      fontWeight: 'bold',
      marginBottom: '1rem'
    }

    switch (section.type) {
      case 'hero':
        return (
          <section
            key={section.id}
            className="min-h-screen flex items-center justify-center relative"
            style={sectionStyle}
          >
            {section.backgroundImage && (
              <div 
                className="absolute inset-0 bg-black bg-opacity-30 z-0"
                style={{ backgroundColor: section.backgroundColor ? `${section.backgroundColor}80` : 'rgba(0,0,0,0.3)' }}
              />
            )}
            <div className="max-w-[1600px] mx-auto px-4 text-center relative z-10">
              {section.title && <h1 style={titleStyle}>{section.title}</h1>}
              {section.content && <p className="text-lg">{section.content}</p>}
              {section.image && (
                <img
                  src={section.image}
                  alt={section.title}
                  className="mt-8 w-full max-w-4xl mx-auto rounded-lg"
                />
              )}
            </div>
          </section>
        )

      case 'text':
        return (
          <section key={section.id} style={sectionStyle} className="relative">
            {section.backgroundImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{ backgroundColor: section.backgroundColor ? `${section.backgroundColor}80` : 'rgba(255,255,255,0.8)' }}
              />
            )}
            <div className="max-w-[1600px] mx-auto relative z-10">
              {section.title && <h2 style={titleStyle}>{section.title}</h2>}
              {section.content && (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              )}
            </div>
          </section>
        )

      case 'image':
        return (
          <section key={section.id} style={sectionStyle} className="relative">
            {section.backgroundImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{ backgroundColor: section.backgroundColor ? `${section.backgroundColor}80` : 'rgba(255,255,255,0.8)' }}
              />
            )}
            <div className="max-w-[1600px] mx-auto relative z-10">
              {section.title && <h2 style={titleStyle}>{section.title}</h2>}
              {section.image && (
                <img
                  src={section.image}
                  alt={section.title}
                  className="w-full rounded-lg"
                />
              )}
              {section.content && <p className="mt-4">{section.content}</p>}
            </div>
          </section>
        )

      case 'gallery':
        return (
          <section key={section.id} style={sectionStyle} className="relative">
            {section.backgroundImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{ backgroundColor: section.backgroundColor ? `${section.backgroundColor}80` : 'rgba(255,255,255,0.8)' }}
              />
            )}
            <div className="max-w-[1600px] mx-auto relative z-10">
              {section.title && <h2 style={titleStyle}>{section.title}</h2>}
              {section.images && section.images.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  {section.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${section.title} ${idx + 1}`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )

      case 'features':
        return (
          <section key={section.id} style={sectionStyle} className="relative">
            {section.backgroundImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{ backgroundColor: section.backgroundColor ? `${section.backgroundColor}80` : 'rgba(255,255,255,0.8)' }}
              />
            )}
            <div className="max-w-[1600px] mx-auto relative z-10">
              {section.title && <h2 style={titleStyle}>{section.title}</h2>}
              {section.content && <p className="mb-6">{section.content}</p>}
              {/* Features can be expanded with more structure */}
            </div>
          </section>
        )

      case 'cta':
        return (
          <section key={section.id} style={sectionStyle} className="relative">
            {section.backgroundImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{ backgroundColor: section.backgroundColor ? `${section.backgroundColor}80` : 'rgba(255,255,255,0.8)' }}
              />
            )}
            <div className="max-w-[1600px] mx-auto text-center relative z-10">
              {section.title && <h2 style={titleStyle}>{section.title}</h2>}
              {section.content && <p className="mb-6">{section.content}</p>}
            </div>
          </section>
        )

      default:
        return (
          <section key={section.id} style={sectionStyle} className="relative">
            {section.backgroundImage && (
              <div 
                className="absolute inset-0 z-0"
                style={{ backgroundColor: section.backgroundColor ? `${section.backgroundColor}80` : 'rgba(255,255,255,0.8)' }}
              />
            )}
            <div className="max-w-[1600px] mx-auto relative z-10">
              {section.title && <h2 style={titleStyle}>{section.title}</h2>}
              {section.content && <p>{section.content}</p>}
            </div>
          </section>
        )
    }
  }

  return (
    <div>
      {page.sections
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .map((section) => renderSection(section))}
    </div>
  )
}

export default PageRenderer

