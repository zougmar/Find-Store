import { useEffect } from 'react'

function setMeta(attribute, key, content) {
  if (!content) return () => {}

  let element = document.head.querySelector(`meta[${attribute}="${key}"]`)
  const created = !element
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  const previous = element.getAttribute('content')
  element.setAttribute('content', content)

  return () => {
    if (created) {
      element.remove()
    } else if (previous != null) {
      element.setAttribute('content', previous)
    }
  }
}

export default function usePageMeta({ title, description, image, url }) {
  useEffect(() => {
    const previousTitle = document.title
    if (title) document.title = title

    let canonical = document.head.querySelector('link[rel="canonical"]')
    const canonicalCreated = !canonical
    let previousCanonical = null
    if (url) {
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.setAttribute('rel', 'canonical')
        document.head.appendChild(canonical)
      }
      previousCanonical = canonical.getAttribute('href')
      canonical.setAttribute('href', url)
    }

    const cleanups = [
      setMeta('name', 'description', description),
      setMeta('property', 'og:title', title),
      setMeta('property', 'og:description', description),
      setMeta('property', 'og:image', image),
      setMeta('property', 'og:url', url),
      setMeta('property', 'og:type', 'product'),
      setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    ]

    return () => {
      document.title = previousTitle
      cleanups.forEach((cleanup) => cleanup())
      if (canonical) {
        if (canonicalCreated) canonical.remove()
        else if (previousCanonical) canonical.setAttribute('href', previousCanonical)
      }
    }
  }, [title, description, image, url])
}
