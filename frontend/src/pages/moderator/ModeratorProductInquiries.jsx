import { useState, useEffect } from 'react'
import ModeratorLayout from '../../components/ModeratorLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import jsPDF from 'jspdf'
import QRCode from 'qrcode'
import logoImage from '../../images/logo.png'

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  converted: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
}

const ModeratorProductInquiries = () => {
  const [inquiries, setInquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [deliveryMen, setDeliveryMen] = useState([])
  const [assigningId, setAssigningId] = useState(null)
  const [selectedDeliveryMan, setSelectedDeliveryMan] = useState('')
  const [deliveryNotes, setDeliveryNotes] = useState('')

  useEffect(() => {
    fetchInquiries()
    fetchDeliveryMen()
  }, [])

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const res = await api.get('/moderator/product-inquiries')
      setInquiries(res.data)
    } catch (error) {
      console.error('Error fetching inquiries:', error)
      toast.error('Failed to fetch product requests')
    } finally {
      setLoading(false)
    }
  }

  const fetchDeliveryMen = async () => {
    try {
      const res = await api.get('/moderator/delivery-men')
      setDeliveryMen(res.data)
    } catch (error) {
      console.error('Error fetching delivery men:', error)
    }
  }

  const generateTicket = async (inquiry) => {
    try {
      // Generate tracking number (using last 12 chars of inquiry ID)
      const trackingNumber = inquiry._id.slice(-12).toUpperCase()
      
      // Load logo image as data URL
      let logoDataUrl = null
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        logoDataUrl = await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              const canvas = document.createElement('canvas')
              canvas.width = img.width
              canvas.height = img.height
              const ctx = canvas.getContext('2d')
              ctx.drawImage(img, 0, 0)
              resolve(canvas.toDataURL('image/png'))
            } catch (error) {
              reject(error)
            }
          }
          img.onerror = reject
          img.src = logoImage
        })
      } catch (error) {
        console.error('Logo loading error:', error)
        // Will use fallback circle if logo fails to load
      }
      
      // Generate QR Code
      let qrDataUrl
      try {
        qrDataUrl = await QRCode.toDataURL(inquiry._id, {
          width: 200,
          margin: 1
        })
      } catch (error) {
        console.error('QR Code generation error:', error)
        qrDataUrl = null
      }

      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 15
      const sectionMargin = 5
      let yPosition = margin

      // Professional Header Section with Brand Color
      const headerHeight = 30
      doc.setFillColor(255, 56, 92) // #FF385C brand color
      doc.rect(0, 0, pageWidth, headerHeight, 'F')
      
      // White text on colored background
      doc.setTextColor(255, 255, 255)
      
      // Add logo image or fallback
      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, 7, 18, 18)
      } else {
        // Fallback: Draw white circle
        doc.setFillColor(255, 255, 255)
        doc.circle(20, 13, 9, 'F')
        doc.setFillColor(255, 56, 92)
        doc.circle(20, 13, 7, 'F')
      }
      
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('FIND STORE', margin + 22, 12)
      
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text('Product Request Ticket', margin + 22, 18)
      doc.text('+212 707625535', pageWidth - margin, 18, { align: 'right' })

      yPosition = headerHeight + 10

      // Tracking Number and QR Code Section with Box
      const trackingBoxHeight = 40
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.5)
      doc.setFillColor(250, 250, 250)
      doc.rect(margin, yPosition, pageWidth - margin * 2, trackingBoxHeight, 'FD')
      
      // QR Code
      if (qrDataUrl) {
        doc.addImage(qrDataUrl, 'PNG', margin + 5, yPosition + 5, 30, 30)
      } else {
        doc.setFillColor(240, 240, 240)
        doc.setDrawColor(200, 200, 200)
        doc.rect(margin + 5, yPosition + 5, 30, 30, 'FD')
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(8)
        doc.text('QR', margin + 20, yPosition + 20, { align: 'center' })
      }
      
      // Tracking Number (large, prominent)
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(20)
      doc.setFont('helvetica', 'bold')
      doc.text('TICKET #', margin + 40, yPosition + 12)
      
      doc.setFontSize(16)
      doc.setTextColor(255, 56, 92)
      doc.text(trackingNumber, margin + 40, yPosition + 22)
      
      doc.setFontSize(8)
      doc.setTextColor(120, 120, 120)
      doc.setFont('helvetica', 'normal')
      const requestDate = new Date(inquiry.createdAt).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
      doc.text(`Request Date: ${requestDate}`, margin + 40, yPosition + 30)

      yPosition += trackingBoxHeight + 10

      // Customer Information Section with Box
      const customerBoxY = yPosition
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      
      // Section Header
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('CUSTOMER INFORMATION', margin + 3, yPosition + 5.5)
      yPosition += 10

      // Customer Details
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      
      const customerDetails = [
        { label: 'Full Name', value: inquiry.fullName || 'N/A' },
        { label: 'Phone', value: inquiry.phone || 'N/A' },
        { label: 'City', value: inquiry.city || 'N/A' },
        { label: 'Address', value: inquiry.address || 'N/A' }
      ]

      customerDetails.forEach((detail, index) => {
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'bold')
        doc.text(`${detail.label}:`, margin + 5, yPosition)
        
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        if (detail.label === 'Address' && detail.value !== 'N/A') {
          const addressLines = doc.splitTextToSize(detail.value, pageWidth - margin * 2 - 40)
          doc.text(addressLines, margin + 25, yPosition)
          yPosition += addressLines.length * 4 + 2
        } else {
          doc.text(detail.value, margin + 25, yPosition)
          yPosition += 5
        }
      })

      // Close customer box
      const customerBoxHeight = yPosition - customerBoxY + 3
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      doc.rect(margin, customerBoxY, pageWidth - margin * 2, customerBoxHeight, 'D')
      yPosition += 5

      // Product Information Section with Box
      const productBoxY = yPosition
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      
      // Section Header
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('PRODUCT INFORMATION', margin + 3, yPosition + 5.5)
      yPosition += 10

      // Product Details
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 100, 100)
      
      // Product Name
      doc.setFont('helvetica', 'bold')
      doc.text('Product Name:', margin + 5, yPosition)
      
      const productName = inquiry.product?.name || inquiry.productName || 'N/A'
      const hasArabic = /[\u0600-\u06FF]/.test(productName)
      
      if (hasArabic) {
        // Render Arabic text to canvas and add as image
        try {
          const tempDiv = document.createElement('div')
          tempDiv.style.position = 'absolute'
          tempDiv.style.visibility = 'hidden'
          tempDiv.style.whiteSpace = 'nowrap'
          tempDiv.style.fontSize = '16px'
          tempDiv.style.fontFamily = 'Arial, "Segoe UI", "Arabic Typesetting", sans-serif'
          tempDiv.style.direction = 'rtl'
          tempDiv.style.textAlign = 'right'
          tempDiv.textContent = productName
          document.body.appendChild(tempDiv)
          
          const textWidth = tempDiv.offsetWidth || tempDiv.scrollWidth
          const textHeight = tempDiv.offsetHeight || 24
          
          const padding = 20
          const canvas = document.createElement('canvas')
          canvas.width = Math.min(textWidth + padding * 2, (pageWidth - margin * 2) * 3.779527559)
          canvas.height = textHeight + padding
          const ctx = canvas.getContext('2d')
          
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          ctx.font = '16px Arial, "Segoe UI", "Arabic Typesetting", sans-serif'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'middle'
          ctx.fillStyle = '#000000'
          ctx.fillText(productName, canvas.width - padding, canvas.height / 2)
          
          document.body.removeChild(tempDiv)
          
          const textImageData = canvas.toDataURL('image/png')
          const maxWidthMm = pageWidth - margin * 2 - 30
          const imgWidthMm = Math.min((canvas.width * 0.264583), maxWidthMm)
          const imgHeightMm = canvas.height * 0.264583
          
          doc.addImage(textImageData, 'PNG', margin + 25, yPosition - 2, imgWidthMm, imgHeightMm)
          yPosition += imgHeightMm + 3
        } catch (error) {
          console.error('Error rendering Arabic text:', error)
          doc.setTextColor(0, 0, 0)
          doc.setFont('helvetica', 'normal')
          doc.text('(Arabic text)', margin + 25, yPosition)
          yPosition += 5
        }
      } else {
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        const productNameLines = doc.splitTextToSize(productName, pageWidth - margin * 2 - 30)
        doc.text(productNameLines, margin + 25, yPosition)
        yPosition += productNameLines.length * 4 + 2
      }

      // Price
      if (inquiry.product?.price != null) {
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'bold')
        doc.text('Price:', margin + 5, yPosition)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(10)
        doc.setTextColor(255, 56, 92)
        doc.setFont('helvetica', 'bold')
        doc.text(`${inquiry.product.price} MAD`, margin + 25, yPosition)
        doc.setFontSize(9)
        yPosition += 6
      }

      // Close product box
      const productBoxHeight = yPosition - productBoxY + 3
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      doc.rect(margin, productBoxY, pageWidth - margin * 2, productBoxHeight, 'D')
      yPosition += 8

      // Status and Notes Section with Box
      const statusBoxY = yPosition
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      
      // Section Header
      doc.setFillColor(245, 247, 250)
      doc.rect(margin, yPosition, pageWidth - margin * 2, 8, 'F')
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('STATUS & NOTES', margin + 3, yPosition + 5.5)
      yPosition += 10

      // Status with colored badge
      doc.setFontSize(9)
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'bold')
      doc.text('Status:', margin + 5, yPosition)
      
      const statusText = inquiry.status.replace('_', ' ').toUpperCase()
      const statusColors = {
        'NEW': [59, 130, 246], // Blue
        'IN PROGRESS': [234, 179, 8], // Yellow
        'CONVERTED': [34, 197, 94], // Green
        'CLOSED': [107, 114, 128] // Gray
      }
      const statusColor = statusColors[statusText] || [107, 114, 128]
      
      // Status badge background
      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
      doc.rect(margin + 25, yPosition - 3, 40, 6, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text(statusText, margin + 45, yPosition, { align: 'center' })
      yPosition += 8

      // Notes
      if (inquiry.note) {
        doc.setTextColor(100, 100, 100)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(9)
        doc.text('Note:', margin + 5, yPosition)
        doc.setTextColor(0, 0, 0)
        doc.setFont('helvetica', 'normal')
        const noteLines = doc.splitTextToSize(inquiry.note, pageWidth - margin * 2 - 30)
        doc.text(noteLines, margin + 25, yPosition)
        yPosition += noteLines.length * 4 + 3
      }

      // Close status box
      const statusBoxHeight = yPosition - statusBoxY + 3
      doc.setDrawColor(220, 220, 220)
      doc.setLineWidth(0.3)
      doc.rect(margin, statusBoxY, pageWidth - margin * 2, statusBoxHeight, 'D')
      yPosition += 10

      // Professional Footer
      doc.setDrawColor(230, 230, 230)
      doc.setLineWidth(0.5)
      doc.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5
      
      doc.setFontSize(7)
      doc.setTextColor(150, 150, 150)
      doc.setFont('helvetica', 'italic')
      doc.text(
        'This ticket serves as a reference document for product request management.',
        margin,
        yPosition,
        { align: 'left', maxWidth: pageWidth - margin * 2 }
      )
      yPosition += 4
      
      doc.setFontSize(6)
      doc.setTextColor(180, 180, 180)
      doc.text(
        'Generated by Find Store Product Request System',
        pageWidth - margin,
        yPosition,
        { align: 'right' }
      )

      // Save the PDF
      const fileName = `Product-Request-${trackingNumber}.pdf`
      doc.save(fileName)
      
      toast.success('Ticket generated and downloaded successfully!')
    } catch (error) {
      console.error('Error generating ticket:', error)
      toast.error('Failed to generate ticket. Please try again.')
    }
  }

  const handleChangeStatus = async (id, status) => {
    try {
      const res = await api.put(`/moderator/product-inquiries/${id}/status`, { status })
      setInquiries(inquiries.map(item => (item._id === id ? res.data : item)))
      if (selectedInquiry?._id === id) {
        setSelectedInquiry(res.data)
      }
      toast.success('Status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleAssignDeliveryMan = async (inquiryId) => {
    if (!selectedDeliveryMan) {
      toast.error('Please select a delivery man')
      return
    }

    try {
      setAssigningId(inquiryId)
      const res = await api.put(`/moderator/product-inquiries/${inquiryId}/assign`, {
        assignedDeliveryMan: selectedDeliveryMan,
        deliveryNotes: deliveryNotes || undefined
      })
      const updated = res.data.inquiry
      setInquiries(inquiries.map(item => (item._id === inquiryId ? updated : item)))
      if (selectedInquiry?._id === inquiryId) {
        setSelectedInquiry(updated)
      }
      setSelectedDeliveryMan('')
      setDeliveryNotes('')
      toast.success('Request sent to delivery man')
    } catch (error) {
      console.error('Error assigning delivery man:', error)
      toast.error(error.response?.data?.message || 'Failed to assign delivery man')
    } finally {
      setAssigningId(null)
    }
  }

  if (loading) {
    return (
      <ModeratorLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </ModeratorLayout>
    )
  }

  return (
    <ModeratorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Product Requests</h1>
            <p className="text-gray-600 mt-1">
              Leads coming from the product detail page. You can call or WhatsApp customers and update status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-gray-200">
              <div className="border-b border-gray-200 px-4 py-3">
                <p className="text-sm font-semibold text-gray-700">
                  All Requests <span className="text-gray-500">({inquiries.length})</span>
                </p>
              </div>
              <div className="max-h-[calc(100vh-260px)] overflow-y-auto">
                {inquiries.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <p>No product requests yet</p>
                  </div>
                ) : (
                  inquiries.map((item) => (
                    <button
                      key={item._id}
                      type="button"
                      onClick={() => setSelectedInquiry(item)}
                      className={`w-full text-left p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                        selectedInquiry?._id === item._id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-sm text-gray-900 line-clamp-1">
                            {item.fullName}
                          </p>
                          <p className="text-xs text-gray-500">{item.phone}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                            {item.productName}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[item.status]}`}
                        >
                          {item.status.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedInquiry ? (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">
                      {selectedInquiry.productName}
                    </h2>
                    <p className="text-sm text-gray-600">
                      Requested by <span className="font-semibold">{selectedInquiry.fullName}</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(selectedInquiry.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <select
                      value={selectedInquiry.status}
                      onChange={(e) => handleChangeStatus(selectedInquiry._id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="new">New</option>
                      <option value="in_progress">In progress</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => generateTicket(selectedInquiry)}
                      className="px-3 py-1.5 text-xs font-semibold bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Generate Ticket
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Customer details
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-700">
                      <p>
                        <span className="font-semibold">Full name:</span> {selectedInquiry.fullName}
                      </p>
                      <p>
                        <span className="font-semibold">Phone:</span> {selectedInquiry.phone}
                      </p>
                      <p>
                        <span className="font-semibold">City:</span> {selectedInquiry.city}
                      </p>
                      <p>
                        <span className="font-semibold">Address:</span> {selectedInquiry.address}
                      </p>
                    </div>

                    {/* Contact Buttons */}
                    {selectedInquiry.phone && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3 mt-3">
                        <p className="text-sm font-semibold text-gray-700">Contact customer</p>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={`tel:${selectedInquiry.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            Call
                          </a>
                          <a
                            href={`https://wa.me/${(selectedInquiry.phone || '').replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            WhatsApp
                          </a>
                          <a
                            href={`sms:${selectedInquiry.phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            SMS
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedInquiry.product && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                        Product snapshot
                      </h3>
                      <div className="bg-gray-50 rounded-lg p-4 flex gap-4 items-center">
                        {selectedInquiry.product.images && selectedInquiry.product.images[0] && (
                          <img
                            src={selectedInquiry.product.images[0]}
                            alt={selectedInquiry.product.name}
                            className="w-20 h-20 rounded-lg object-cover border border-gray-200"
                          />
                        )}
                        <div className="text-sm text-gray-700">
                          <p className="font-semibold">{selectedInquiry.product.name}</p>
                          {selectedInquiry.product.price != null && (
                            <p className="text-gray-600 mt-1">
                              Price: {selectedInquiry.product.price} MAD
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {selectedInquiry.note && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                      Note from customer
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedInquiry.note}
                    </div>
                  </div>
                )}

                {/* Assign to Delivery Man */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Assign to delivery man
                  </h3>
                  {selectedInquiry.assignedDeliveryMan ? (
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <span className="font-semibold">Assigned to:</span>{' '}
                        {selectedInquiry.assignedDeliveryMan.name}{' '}
                        {selectedInquiry.assignedDeliveryMan.phone &&
                          `(${selectedInquiry.assignedDeliveryMan.phone})`}
                      </p>
                      <p>
                        <span className="font-semibold">Delivery status:</span>{' '}
                        {selectedInquiry.deliveryStatus || 'pending'}
                      </p>
                      {selectedInquiry.deliveryNotes && (
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-semibold">Notes:</span> {selectedInquiry.deliveryNotes}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-col md:flex-row gap-2">
                        <select
                          value={selectedDeliveryMan}
                          onChange={(e) => setSelectedDeliveryMan(e.target.value)}
                          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Select delivery man</option>
                          {deliveryMen.map((dm) => (
                            <option key={dm._id} value={dm._id}>
                              {dm.name} {dm.phone ? `(${dm.phone})` : ''}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleAssignDeliveryMan(selectedInquiry._id)}
                          disabled={assigningId === selectedInquiry._id}
                          className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60"
                        >
                          {assigningId === selectedInquiry._id ? 'Sending...' : 'Send to delivery man'}
                        </button>
                      </div>
                      <textarea
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Optional note for delivery man (e.g., best time to call, building details)..."
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md border border-gray-200 p-12 text-center">
                <p className="text-gray-500 text-lg">Select a request to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModeratorLayout>
  )
}

export default ModeratorProductInquiries

