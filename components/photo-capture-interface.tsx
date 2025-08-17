"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Camera, Upload, RotateCcw, Check, X, Sparkles, Gift } from "lucide-react"
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

type CaptureStatus = "idle" | "capturing" | "processing" | "animating" | "confirming" | "saving"

export default function PhotoCaptureInterface({ user }: PhotoCaptureInterfaceProps) {
  const router = useRouter()
  const [status, setStatus] = useState<CaptureStatus>("idle")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Camera access is not available on this browser. Please use an HTTPS connection.")
      return
    }
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setStatus("capturing")
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions.")
      console.error("Camera error:", err)
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setStatus("idle")
  }, [stream])

  const processOCR = useCallback(async (imageUrl: string) => {
    setStatus("processing")
    setError(null)
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const formData = new FormData()
      formData.append("file", blob)
      const ocrResponse = await fetch("/api/ocr", { method: "POST", body: formData })

      if (!ocrResponse.ok) {
        const errorData = await ocrResponse.json().catch(() => ({}))
        throw new Error(errorData.error || "OCR request failed")
      }

      const ocrData = await ocrResponse.json()
      setOcrResult({ cleaned_text: ocrData.cleaned_text || "", items: ocrData.items || [] })
      setStatus("animating")

      // Animation sequence
      setTimeout(() => setStatus("confirming"), 2000) // Total animation time
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process text recognition.")
      setStatus("idle")
      setCapturedImage(null)
    }
  }, [])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

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
      0.9,
    )
  }, [stopCamera, processOCR])

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

  const handleConfirmAndSave = useCallback(async () => {
    if (!capturedImage || !ocrResult) return
    setStatus("saving")
    setError(null)
    try {
      const response = await fetch(capturedImage)
      const blob = await response.blob()
      const fileName = `${user.id}/${Date.now()}.jpg`

      const { error: uploadError } = await supabase.storage.from("documents").upload(fileName, blob, { contentType: "image/jpeg" })
      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage.from("documents").getPublicUrl(fileName)
      const { data: documentData, error: dbError } = await supabase
        .from("documents")
        .insert({ user_id: user.id, file_path: publicUrlData.publicUrl, recognized_text: ocrResult })
        .select("id")
        .single()

      if (dbError) throw dbError
      router.push(`/documents/${documentData.id}`)
    } catch (err) {
      setError("Failed to save document. Please try again.")
      console.error("Upload error:", err)
      setStatus("confirming")
    }
  }, [capturedImage, ocrResult, user.id, router])

  const resetCapture = useCallback(() => {
    setCapturedImage(null)
    setOcrResult(null)
    setError(null)
    setStatus("idle")
  }, [])

  const goToDashboard = useCallback(() => router.push("/"), [router])

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop())
      if (capturedImage) URL.revokeObjectURL(capturedImage)
    }
  }, [stream, capturedImage])

  const isIdle = status === "idle"
  const isCapturing = status === "capturing"
  const isProcessing = status === "processing"
  const isAnimating = status === "animating"
  const isConfirming = status === "confirming"
  const isSaving = status === "saving"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 pt-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Capture Your Document</h1>
          <p className="text-purple-600">
            {isConfirming ? "Review the recognized text below." : "Align the document and scan."}
          </p>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <Button variant="outline" onClick={goToDashboard} className="mt-4">
            Go to Dashboard
          </Button>
        </div>

        <Card className="overflow-hidden bg-white shadow-xl border-0">
          <div className="aspect-[4/3] bg-gray-100 relative flex items-center justify-center">
            {isIdle && !capturedImage && (
              <div className="text-center">
                <Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <div className="space-y-3">
                  <Button onClick={startCamera} className="w-full bg-purple-800 hover:bg-purple-700 text-white">
                    <Camera className="w-5 h-5 mr-2" /> Open Camera
                  </Button>
                  <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                    <Upload className="w-5 h-5 mr-2" /> Upload Image
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                </div>
              </div>
            )}

            {isCapturing && (
              <div className="relative w-full h-full">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg" />
              </div>
            )}

            {capturedImage && !isIdle && !isCapturing && (
              <img
                src={capturedImage}
                alt="Captured document"
                className={`w-full h-full object-cover transition-opacity duration-500 ${isAnimating || isConfirming ? "opacity-20 blur-sm" : "opacity-100"}`}
              />
            )}

            {(isProcessing || isSaving) && (
              <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-black/60 backdrop-blur-sm text-white p-6 rounded-2xl flex flex-col items-center gap-2">
                  <Sparkles className="w-12 h-12 animate-pulse" />
                  <p className="font-semibold text-base">{isSaving ? "Saving Document..." : "Recognizing Text..."}</p>
                </div>
              </div>
            )}

            {isAnimating && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="animate-bounce">
                  <Gift className="w-24 h-24 text-purple-600" />
                </div>
              </div>
            )}

            {isConfirming && ocrResult && (
              <div className="absolute inset-0 p-6 z-10">
                <h3 className="text-center font-semibold text-lg mb-3 text-gray-800">Your text is ready!</h3>
                <ScrollArea className="h-48 md:h-56">
                  <ul className="space-y-2 p-2">
                    {ocrResult.items.map((item, index) => (
                      <li
                        key={index}
                        className="bg-white bg-opacity-80 backdrop-blur-sm p-2 rounded-md text-purple-900 text-sm shadow-lg animate-burst-in"
                        style={{ animationDelay: `${500 + index * 70}ms` }}
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="p-6 bg-gray-50">
            {isCapturing && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={stopCamera} className="flex-1">
                  <X className="w-4 h-4 mr-2" /> Cancel
                </Button>
                <Button onClick={capturePhoto} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                  <Camera className="w-4 h-4 mr-2" /> Scan Now
                </Button>
              </div>
            )}

            {isConfirming && (
              <div className="flex gap-3">
                <Button variant="outline" onClick={resetCapture} className="flex-1" disabled={isSaving}>
                  <RotateCcw className="w-4 h-4 mr-2" /> Retake
                </Button>
                <Button onClick={handleConfirmAndSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isSaving}>
                  {isSaving ? (
                    <><div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-4 h-4 mr-2" /> Confirm & Save</>
                  )}
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}