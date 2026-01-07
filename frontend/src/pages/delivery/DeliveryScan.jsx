import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Html5Qrcode } from 'html5-qrcode'
import toast from 'react-hot-toast'

const DeliveryScan = () => {
  const navigate = useNavigate()
  const [scanning, setScanning] = useState(false)
  const html5QrCodeRef = useRef(null)
  const [hasScanned, setHasScanned] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualOrderId, setManualOrderId] = useState('')

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

      // Wait for React to render the qr-reader element
      // Use a more reliable method to wait for element
      let qrReaderElement = null
      let attempts = 0
      const maxAttempts = 20
      
      while (!qrReaderElement && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 50))
        qrReaderElement = document.getElementById('qr-reader')
        attempts++
      }
      
      if (!qrReaderElement) {
        setScanning(false)
        throw new Error('QR reader element not found. Please refresh the page and try again.')
      }

      // Create instance with verbose logging
      const html5QrCode = new Html5Qrcode('qr-reader', {
        verbose: true // Enable verbose logging
      })
      html5QrCodeRef.current = html5QrCode

      // Try to get available cameras
      let cameraId = null
      try {
        const devices = await Html5Qrcode.getCameras()
        if (devices && devices.length > 0) {
          // Try to find back camera first (environment)
          const backCamera = devices.find(device => 
            device.label.toLowerCase().includes('back') || 
            device.label.toLowerCase().includes('rear') ||
            device.label.toLowerCase().includes('environment')
          )
          // Otherwise use the first available camera
          cameraId = backCamera ? backCamera.id : devices[0].id
        }
      } catch (err) {
        console.log('Could not enumerate cameras, using default:', err)
      }

      // Configuration based on available space
      const qrboxSize = Math.min(250, window.innerWidth - 40)
      
      const config = {
        fps: 10,
        qrbox: { width: qrboxSize, height: qrboxSize },
        aspectRatio: 1.0,
        disableFlip: false
      }

      // Try to start with specific camera or fallback to facingMode
      try {
        if (cameraId) {
          await html5QrCode.start(
            cameraId,
            config,
            (decodedText) => {
              handleScanSuccess(decodedText, html5QrCode)
            },
            (errorMessage) => {
              // Error callback - ignore scanning errors
            }
          )
        } else {
          // Fallback to facingMode
          await html5QrCode.start(
            { facingMode: 'environment' },
            config,
            (decodedText) => {
              handleScanSuccess(decodedText, html5QrCode)
            },
            (errorMessage) => {
              // Error callback - ignore scanning errors
            }
          )
        }
      } catch (cameraError) {
        // If back camera fails, try front camera
        if (cameraError.name === 'NotAllowedError' || cameraError.name === 'NotFoundError') {
          try {
            await html5QrCode.start(
              { facingMode: 'user' },
              config,
              (decodedText) => {
                handleScanSuccess(decodedText, html5QrCode)
              },
              (errorMessage) => {
                // Error callback
              }
            )
          } catch (frontCameraError) {
            throw cameraError // Throw original error
          }
        } else {
          throw cameraError
        }
      }
    } catch (error) {
      console.error('Error starting QR scanner:', error)
      let errorMessage = 'Failed to start camera. '
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Camera permission denied. Please allow camera access in your browser settings.'
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found. Please make sure you have a camera connected.'
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is being used by another application. Please close other apps using the camera.'
      } else {
        errorMessage += error.message || 'Please check permissions and try again.'
      }
      
      toast.error(errorMessage)
      setScanning(false)
      
      // Check if HTTPS is required
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        toast.error('Camera requires HTTPS. Use manual entry or access via HTTPS.', { duration: 5000 })
        setShowManualEntry(true)
      }
    }
  }

  const handleManualEntry = () => {
    if (!manualOrderId.trim()) {
      toast.error('Please enter an order ID')
      return
    }
    
    const orderId = manualOrderId.trim()
    navigate(`/delivery/orders/${orderId}?scanned=true`)
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
        {!scanning && !showManualEntry ? (
          <div className="text-center w-full max-w-md">
            <div className="bg-white rounded-2xl p-8 shadow-xl mb-6">
              <svg className="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Scan QR Code</h2>
              <p className="text-gray-600 mb-6">Position the QR code within the camera view</p>
              <div className="space-y-3">
                <button
                  onClick={startScanning}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-8 rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
                >
                  Start Camera
                </button>
                <button
                  onClick={() => setShowManualEntry(true)}
                  className="w-full bg-gray-100 text-gray-700 py-3 px-8 rounded-lg font-semibold hover:bg-gray-200 transition-all border border-gray-300"
                >
                  Enter Order ID Manually
                </button>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Make sure to allow camera access when prompted
            </p>
            {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ Camera requires HTTPS. Use manual entry if camera doesn't work.
                </p>
              </div>
            )}
          </div>
        ) : showManualEntry ? (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg p-6 shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Enter Order ID</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Order ID or Tracking Number
                  </label>
                  <input
                    type="text"
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    placeholder="Enter order ID (last 12 chars or full ID)"
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    You can find the order ID on the delivery ticket (last 12 characters or full ID)
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowManualEntry(false)
                      setManualOrderId('')
                    }}
                    className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleManualEntry}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Open Order
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : scanning ? (
          <div className="w-full max-w-md">
            <div className="bg-white rounded-lg p-4 shadow-xl mb-4">
              <div id="qr-reader" className="w-full rounded-lg overflow-hidden" style={{ minHeight: '300px' }}></div>
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
        ) : null}
      </div>
    </div>
  )
}

export default DeliveryScan
