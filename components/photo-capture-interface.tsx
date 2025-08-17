"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area"
import { Camera, Upload, RotateCcw, Check, X, Sparkles, Gift, PlusCircle } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"
import { useRouter } from "next/navigation"
import { useTranslation } from 'react-i18next';
import '@/i18n'; // Initialize i18n

// --- TYPES & INTERFACES ---
interface OCRResult {
  cleaned_text: string
  items: string[]
  newlyFoundItems?: string[]
}
type CaptureStatus = "idle" | "capturing" | "processing" | "animating" | "confirming" | "saving"
interface PhotoCaptureInterfaceProps {
  user: User
}

// --- HELPER FUNCTIONS & COMPONENTS ---
const enrichOcrResult = (result: Omit<OCRResult, 'newlyFoundItems'>): OCRResult => {
  const { cleaned_text, items } = result;
  const existingItemsSet = new Set(items.map(item => item.toLowerCase()));
  const lines = cleaned_text.split('\n');
  const newlyFoundPhrases: string[] = [];

  for (const line of lines) {
    const potentialPhrases = line.match(/([a-zA-Z'-]+\s*)+/g) || [];
    for (const phrase of potentialPhrases) {
      const trimmedPhrase = phrase.trim();
      if (trimmedPhrase.length > 2 && !existingItemsSet.has(trimmedPhrase.toLowerCase())) {
        newlyFoundPhrases.push(trimmedPhrase);
      }
    }
  }
  
  const uniqueNewItems = [...new Set(newlyFoundPhrases)];
  return {
    ...result,
    items: result.items.sort((a, b) => a.localeCompare(b)),
    newlyFoundItems: uniqueNewItems,
  };
};

const HighlightedText = ({ text, wordsToHighlight, onAdd }: { text: string; wordsToHighlight: string[]; onAdd: (item: string) => void; }) => {
  if (!wordsToHighlight || wordsToHighlight.length === 0) {
    return <p className="text-sm text-gray-700 whitespace-pre-wrap">{text}</p>;
  }
  const regex = new RegExp(`(${wordsToHighlight.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <p className="text-sm text-gray-700 whitespace-pre-wrap">
      {parts.map((part, index) =>
        wordsToHighlight.some(word => word.toLowerCase() === part.toLowerCase()) ? (
          <button
            key={index}
            onClick={() => onAdd(part)}
            className="bg-yellow-200 rounded-sm px-1 mx-px text-black hover:bg-yellow-300 transition-colors duration-200"
          >
            {part}
          </button>
        ) : (
          <span key={index}>{part}</span>
        )
      )}
    </p>
  );
};

// --- MAIN COMPONENT ---
export default function PhotoCaptureInterface({ user }: PhotoCaptureInterfaceProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter()
  const [status, setStatus] = useState<CaptureStatus>("idle")
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const handleAddItem = useCallback((itemToAdd: string) => {
    setOcrResult(prevResult => {
      if (!prevResult) return null;
      const newItems = prevResult.items.includes(itemToAdd)
        ? prevResult.items
        : [...prevResult.items, itemToAdd].sort((a, b) => a.localeCompare(b));
      const newNewlyFoundItems = prevResult.newlyFoundItems?.filter(item => item !== itemToAdd);
      return { ...prevResult, items: newItems, newlyFoundItems: newNewlyFoundItems };
    });
  }, []);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError(t('errorCameraAccess'));
      return
    }
    try {
      setError(null)
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } } })
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        setStream(mediaStream)
        setStatus("capturing")
      }
    } catch (err) {
      setError(t('errorUnableToAccessCamera'));
      console.error("Camera error:", err)
    }
  }, [t])

  const stopCamera = useCallback(() => {
    if (stream) stream.getTracks().forEach((track) => track.stop())
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
        throw new Error(errorData.error || t('errorOcrFailed'))
      }
      const ocrData = await ocrResponse.json()
      const initialResult = { cleaned_text: ocrData.cleaned_text || "", items: ocrData.items || [] };
      const enrichedResult = enrichOcrResult(initialResult);
      setOcrResult(enrichedResult)
      setStatus("animating")
      setTimeout(() => setStatus("confirming"), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('errorOcrFailed'))
      setStatus("idle")
      setCapturedImage(null)
    }
  }, [t])

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current, canvas = canvasRef.current, context = canvas.getContext("2d")
    if (!context) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)
        setCapturedImage(imageUrl)
        stopCamera()
        processOCR(imageUrl)
      }
    }, "image/jpeg", 0.9)
  }, [stopCamera, processOCR])

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const imageUrl = URL.createObjectURL(file)
      setCapturedImage(imageUrl)
      setError(null)
      processOCR(imageUrl)
    }
  }, [processOCR])

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
        .insert({ user_id: user.id, file_path: publicUrlData.publicUrl, recognized_text: { ...ocrResult, newlyFoundItems: undefined } })
        .select("id").single()
      if (dbError) throw dbError
      router.push(`/documents/${documentData.id}`)
    } catch (err) {
      setError(t('errorSaveFailed'));
      console.error("Upload error:", err)
      setStatus("confirming")
    }
  }, [capturedImage, ocrResult, user.id, router, t])

  const resetCapture = useCallback(() => {
    setCapturedImage(null); setOcrResult(null); setError(null); setStatus("idle")
  }, [])

  const goToDashboard = useCallback(() => router.push("/"), [router])

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop())
      if (capturedImage) URL.revokeObjectURL(capturedImage)
    }
  }, [stream, capturedImage])

  const isIdle = status === "idle", isCapturing = status === "capturing", isProcessing = status === "processing", isAnimating = status === "animating", isConfirming = status === "confirming", isSaving = status === "saving"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8 pt-8">
           <div className="flex justify-center items-center mb-4 gap-4">
            <h1 className="text-3xl font-bold text-purple-800">{t('captureYourDocument')}</h1>
            <div className="flex gap-1">
              <Button size="sm" variant={i18n.language === 'en' ? 'default' : 'outline'} onClick={() => changeLanguage('en')}>EN</Button>
              <Button size="sm" variant={i18n.language === 'zh' ? 'default' : 'outline'} onClick={() => changeLanguage('zh')}>ZH</Button>
            </div>
          </div>
          <p className="text-purple-600">{isConfirming ? t('reviewOcrItems') : t('alignAndScan')}</p>
          {error && <p className="text-red-500 mt-4">{error}</p>}
          <Button variant="outline" onClick={goToDashboard} className="mt-4">{t('goToDashboard')}</Button>
        </div>

        <Card className="overflow-hidden bg-white shadow-xl border-0">
          <div className="aspect-[4/3] bg-gray-100 relative flex items-center justify-center">
            {isIdle && !capturedImage && (
              <div className="text-center"><Camera className="w-16 h-16 text-purple-400 mx-auto mb-4" /><div className="space-y-3"><Button onClick={startCamera} className="w-full bg-purple-800 hover:bg-purple-700 text-white"><Camera className="w-5 h-5 mr-2" /> {t('openCamera')}</Button><Button variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full"><Upload className="w-5 h-5 mr-2" /> {t('uploadImage')}</Button><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" /></div></div>)}
            {isCapturing && (<div className="relative w-full h-full"><video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" /><canvas ref={canvasRef} className="hidden" /><div className="absolute inset-4 border-2 border-white border-dashed rounded-lg" /></div>)}
            {capturedImage && !isIdle && !isCapturing && (<img src={capturedImage} alt="Captured document" className={`w-full h-full object-cover transition-opacity duration-500 ${isAnimating || isConfirming ? "opacity-20 blur-sm" : "opacity-100"}`} />)}
            {(isProcessing || isSaving) && (<div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"><div className="bg-black/60 backdrop-blur-sm text-white p-6 rounded-2xl flex flex-col items-center gap-2"><Sparkles className="w-12 h-12 animate-pulse" /><p className="font-semibold text-base">{isSaving ? t('savingDocumentStatus') : t('recognizingStatus')}</p></div></div>)}
            {isAnimating && (<div className="absolute inset-0 flex items-center justify-center z-10"><div className="animate-bounce"><Gift className="w-24 h-24 text-purple-600" /></div></div>)}
            {isConfirming && ocrResult && (
              <div className="absolute inset-0 p-2 z-10 flex flex-col animate-burst-in" style={{ animationDelay: '400ms' }}>
                <Tabs defaultValue="full-text" className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 shrink-0"><TabsTrigger value="full-text">{t('fullTextView')}</TabsTrigger><TabsTrigger value="items">{t('recognizedItems')}</TabsTrigger></TabsList>
                  <TabsContent value="full-text" className="flex-grow mt-2"><Card className="h-full w-full bg-white/80 backdrop-blur-sm"><CardContent className="p-3"><ScrollArea className="h-[240px]"><HighlightedText text={ocrResult.cleaned_text} wordsToHighlight={ocrResult.newlyFoundItems || []} onAdd={handleAddItem} /></ScrollArea></CardContent></Card></TabsContent>
                  <TabsContent value="items" className="flex-grow mt-2"><Card className="h-full w-full bg-white/80 backdrop-blur-sm"><CardContent className="p-3"><ScrollArea className="h-[240px]">
                    <h4 className="text-sm font-semibold mb-2 text-gray-600">{t('suggestedItems')}</h4>
                    <ul className="space-y-1 mb-3">
                      {ocrResult.newlyFoundItems?.map((item) => (<li key={item} className="bg-yellow-100/80 p-2 rounded-md text-yellow-900 text-xs shadow-sm flex justify-between items-center"><span className="font-medium">{item}</span><Button size="sm" variant="ghost" className="h-auto p-1" onClick={() => handleAddItem(item)}><PlusCircle className="w-4 h-4"/> {t('add')}</Button></li>))}
                      {ocrResult.newlyFoundItems?.length === 0 && <p className="text-gray-400 text-center text-xs p-2">No new items suggested.</p>}
                    </ul>
                    <h4 className="text-sm font-semibold mb-2 text-gray-600">{t('confirmedItems')}</h4>
                    <ul className="space-y-1">
                      {ocrResult.items.map((item) => (<li key={item} className="bg-purple-50/90 p-2 rounded-md text-purple-900 text-xs shadow-sm">{item}</li>))}
                      {ocrResult.items.length === 0 && <p className="text-gray-400 text-center text-xs p-2">{t('noItemsRecognized')}</p>}
                    </ul>
                  </ScrollArea></CardContent></Card></TabsContent>
                </Tabs>
              </div>)}
          </div>
          <div className="p-6 bg-gray-50">
            {isCapturing && (<div className="flex gap-3"><Button variant="outline" onClick={stopCamera} className="flex-1"><X className="w-4 h-4 mr-2" /> {t('cancel')}</Button><Button onClick={capturePhoto} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"><Camera className="w-4 h-4 mr-2" /> {t('scanNow')}</Button></div>)}
            {isConfirming && (<div className="flex gap-3"><Button variant="outline" onClick={resetCapture} className="flex-1" disabled={isSaving}><RotateCcw className="w-4 h-4 mr-2" /> {t('retake')}</Button><Button onClick={handleConfirmAndSave} className="flex-1 bg-green-600 hover:bg-green-700 text-white" disabled={isSaving}>{isSaving ? (<><div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('savingStatus')}</>) : (<><Check className="w-4 h-4 mr-2" /> {t('confirmAndSave')}</>)}</Button></div>)}
          </div>
        </Card>
      </div>
    </div>
  )
}
