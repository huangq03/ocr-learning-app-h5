
"use client"

import type React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Camera, Upload, RotateCcw, Check, X, FileText, Sparkles, ArrowRight } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"

interface PhotoCaptureInterfaceProps {
  user: User
}

interface OCRResult {
  cleaned_text: string
  items: string[]
}

export default function PhotoCaptureInterface({ user }: PhotoCaptureInterfaceProps) {
  const router = useRouter()
  const [isCapturing, setIsCapturing] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)

  const [isProcessingOCR, setIsProcessingOCR] = useState(false)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)
  const [showTransformAnimation, setShowTransformAnimation] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)


  // Start camera
  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not available on this browser or device. Please use Safari on an HTTPS website.");
      return;
    }
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setIsCapturing(true)
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.")
      console.error("Camera error:", err)
    }
  }, [])

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCapturing(false)
  }, [stream])

  const processOCR = useCallback(async (imageUrl: string) => {
    setIsProcessingOCR(true)
    setOcrProgress(0)
    setError(null)

    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const formData = new FormData()
      formData.append("file", blob)

      const ocrResponse = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      })

      if (!ocrResponse.ok) {
        throw new Error("OCR request failed")
      }

      const ocrData = await ocrResponse.json()

      const result: OCRResult = {
        cleaned_text: ocrData.cleaned_text || '',
        items: ocrData.items || [],
      }

      setOcrResult(result)

      // Trigger transform animation
      setShowTransformAnimation(true)
      setTimeout(() => setShowTransformAnimation(false), 1500)
    } catch (err) {
      setError("Failed to process text recognition. Please try again.")
      console.error("OCR error:", err)
    } finally {
      setIsProcessingOCR(false)
      setOcrProgress(0)
    }
  }, [])

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")

    if (!context) return

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Convert to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageUrl = URL.createObjectURL(blob)
          setCapturedImage(imageUrl)
          stopCamera()
          processOCR(imageUrl)
        }
      },
      "image/jpeg",
      0.8,
    )
  }, [stopCamera, processOCR])

  // Handle file upload from input
  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const imageUrl = URL.createObjectURL(file)
        setCapturedImage(imageUrl)
        setError(null)
        processOCR(imageUrl)
      }
    },
    [processOCR],
  )

  // Upload to Supabase
  const uploadImage = useCallback(async () => {
    if (!capturedImage || !ocrResult) return

    setIsUploading(true)
    setError(null)

    try {
      // Convert image URL to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()

      // Generate unique filename
      const fileName = `${user.id}/${Date.now()}.jpg`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage.from("documents").upload(fileName, blob, {
        contentType: "image/jpeg",
        upsert: false,
      })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(fileName)
      const publicUrl = publicUrlData.publicUrl

      const { data: documentData, error: dbError } = await supabase
        .from("documents")
        .insert({
          user_id: user.id,
          file_path: publicUrl,
          recognized_text: ocrResult,
        })
        .select()
        .single()

      if (dbError) throw dbError

      setSavedDocumentId(documentData.id)
      setUploadSuccess(true)
    } catch (err) {
      setError("Failed to upload document. Please try again.")
      console.error("Upload error:", err)
    } finally {
      setIsUploading(false)
    }
  }, [capturedImage, ocrResult, user.id])

  const resetCapture = useCallback(() => {
    setCapturedImage(null)
    setOcrResult(null)
    setError(null)
    setShowTransformAnimation(false)
    setSavedDocumentId(null)
    setUploadSuccess(false)
  }, [])

  // Navigate to text selection
  const goToTextSelection = useCallback(() => {
    if (savedDocumentId) {
      router.push(`/documents/${savedDocumentId}`)
    }
  }, [savedDocumentId, router])

  // Added navigation to dashboard
  const goToDashboard = useCallback(() => {
    router.push("/")
  }, [router])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      if (capturedImage) {
        URL.revokeObjectURL(capturedImage)
      }
    }
  }, [stream, capturedImage])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Capture Your Document</h1>
          <p className="text-purple-600">Align the document within the frame and click to scan.</p>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <Button
            variant="outline"
            onClick={goToDashboard}
            className="mt-4 border-purple-200 text-purple-700 hover:bg-purple-50 bg-transparent"
          >
            Go to Dashboard
          </Button>
        </div>

        {/* Main Capture Area */}
        <Card className="overflow-hidden bg-white shadow-xl border-0">
          <div className="aspect-[4/3] bg-gray-100 relative">
            {!isCapturing && !capturedImage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Ready to capture</p>
                  <div className="space-y-3">
                    <Button
                      onClick={startCamera}
                      className="w-full bg-purple-800 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105"
                    >
                      <Camera className="w-5 h-5 mr-2" />
                      Open Camera
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full border-purple-200 text-purple-700 hover:bg-purple-50 py-3 rounded-xl"
                    >
                      <Upload className="w-5 h-5 mr-2" />
                      Upload Image
                    </Button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>
                </div>
              </div>
            )}

            {isCapturing && (
              <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                {/* Overlay guide */}
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-70" />
                <div className="absolute top-4 left-4 right-4">
                  <p className="text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full text-center">
                    Ensure good lighting for optimal results!
                  </p>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="relative w-full h-full">
                <img
                  src={capturedImage || "/placeholder.svg"}
                  alt="Captured document"
                  className={`w-full h-full object-cover transition-all duration-1000 ${
                    showTransformAnimation ? "scale-95 opacity-80" : "scale-100 opacity-100"
                  }`}
                />

                {isProcessingOCR && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white bg-black bg-opacity-30 p-6 rounded-2xl backdrop-blur-sm">
                      <div className="relative">
                        <Sparkles className="w-16 h-16 mx-auto mb-4 animate-pulse" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-20 h-20 border-4 border-white border-t-transparent rounded-full animate-spin opacity-50" />
                        </div>
                      </div>
                      <p className="font-semibold text-lg mb-2">Recognizing Text...</p>
                      <div className="flex justify-center my-2">
                        <div className="w-4 h-4 rounded-full bg-white mx-1 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-4 h-4 rounded-full bg-white mx-1 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-4 h-4 rounded-full bg-white mx-1 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                      <p className="text-sm mt-2 opacity-80">Processing...</p>
                    </div>
                  </div>
                )}

                {showTransformAnimation && ocrResult && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white bg-black bg-opacity-30 p-6 rounded-2xl backdrop-blur-sm animate-pulse">
                      <FileText className="w-20 h-20 mx-auto mb-4" />
                      <p className="font-bold text-xl">Text Recognized!</p>
                      <div className="mt-4 max-w-xs">
                        <div className="bg-white bg-opacity-20 rounded-lg p-3">
                          <p className="text-sm opacity-90 line-clamp-3">{ocrResult.cleaned_text.substring(0, 100)}...</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white bg-black bg-opacity-30 p-6 rounded-2xl backdrop-blur-sm">
                      <Check className="w-16 h-16 mx-auto mb-2" />
                      <p className="font-semibold">Document Saved!</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6">
            {isCapturing && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={stopCamera}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={capturePhoto}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Scan Now
                </Button>
              </div>
            )}

            {capturedImage && !uploadSuccess && !isProcessingOCR && (
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={resetCapture}
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 bg-transparent"
                  disabled={isUploading}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={uploadImage}
                  disabled={isUploading || !ocrResult}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Save Document
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Added button to navigate to text selection after successful upload */}
            {uploadSuccess && savedDocumentId && (
              <Button
                onClick={goToTextSelection}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105"
              >
                Go to Text Selection
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
