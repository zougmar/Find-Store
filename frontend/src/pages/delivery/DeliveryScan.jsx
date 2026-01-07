import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'

const DeliveryScan = () => {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const html5QrCodeRef = useRef(null)
  const [hasScanned, setHasScanned] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('delivery_token')
    if (!token) {
      navigate('/delivery/login')
      return
    }

    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            console.log('QR scanner stopped')
          })
          .catch((err) => {
            console.error('Error stopping QR scanner:', err)
          })
      }
    }
  }, [navigate])

  const startScanning = async () => {
    try {
      setScanning(true)
      setHasScanned(false)

      // Create instance
      const html5QrCode = new Html5Qrcode('qr-reader')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          // Success callback
          handleScanSuccess(decodedText, html5QrCode)
        },
        (errorMessage) => {
          // Error callback - ignore, scanning is continuous
        }
      )
    } catch (error) {
      console.error('Error starting QR scanner:', error)
      toast.error('Failed to start camera. Please check permissions.')
      setScanning(false)
    }
  }

  const stopScanning = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop()
        html5QrCodeRef.current.clear()
        html5QrCodeRef.current = null
      }
      setScanning(false)
    } catch (error) {
      console.error('Error stopping QR scanner:', error)
    }
  }

  const handleScanSuccess = async (decodedText, html5QrCode) => {
    if (hasScanned) return // Prevent multiple scans
    
    setHasScanned(true)
    await stopScanning()

    // Extract order ID from QR code
    // QR code should contain the order ID (full or partial)
    let orderId = decodedText.trim()

    // If it's a URL, extract the order ID
    if (orderId.includes('/')) {
      const parts = orderId.split('/')
      orderId = parts[parts.length - 1]
    }

    // If it's just the last 12 characters, we'll try to find the full order ID
    if (orderId.length === 12) {
      toast.success('QR Code scanned! Finding order...')
      // Navigate and let the order detail page handle finding the order
      navigate(`/delivery/orders/${orderId}?scanned=true`)
    } else {
      // Assume it's a full order ID
      toast.success('QR Code scanned! Loading order...')
      navigate(`/delivery/orders/${orderId}?scanned=true`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                stopScanning()
                navigate('/delivery/dashboard')
              }}
              className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-all"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold">Scan QR Code</h1>
            <div className="w-9"></div>
          </div>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        {!scanning ? (
          <div className="text-center">
            <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
              <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ready to Scan</h2>
              <p className="text-gray-600 mb-6">Position the QR code within the camera view</p>
              <button
                onClick={startScanning}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
              >
                Start Camera
              </button>
            </div>
            <p className="text-gray-400 text-sm">
              Make sure to allow camera access when prompted
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg p-4 shadow-xl mb-4">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden"></div>
            </div>
            <button
              onClick={stopScanning}
              className="w-full bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-600 transition-all"
            >
              Stop Scanning
            </button>
            <p className="text-center text-gray-400 text-sm mt-4">
              Point camera at QR code on the delivery ticket
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DeliveryScan
