'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Volume2, ArrowLeft, ArrowRight, Check, X } from 'lucide-react';

interface StudySession {
  type: 'recitation' | 'dictation';
  items: string[];
  documentId: string;
}

// --- Recitation Component ---
const RecitationInterface = ({ items, onComplete }: { items: string[]; onComplete: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const progress = ((currentIndex + 1) / items.length) * 100;

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recitation</CardTitle>
        <p className="text-gray-500">Read the item aloud.</p>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent className="text-center">
        <div className="h-40 flex items-center justify-center p-4">
          <p className="text-3xl font-bold text-gray-800">{items[currentIndex]}</p>
        </div>
        <div className="flex justify-between mt-4">
          <Button variant="outline" onClick={handlePrev} disabled={currentIndex === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
          <Button onClick={handleNext}>
            {currentIndex === items.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Dictation Component ---
const DictationInterface = ({ items, onComplete }: { items: string[]; onComplete: () => void }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
  const progress = ((currentIndex + 1) / items.length) * 100;

  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    speechSynthesis.speak(utterance);
  };

  const handleCheck = () => {
    if (userInput.trim().toLowerCase() === items[currentIndex].toLowerCase()) {
      setFeedback('correct');
    } else {
      setFeedback('incorrect');
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserInput('');
      setFeedback(null);
    } else {
      onComplete();
    }
  };

  useEffect(() => {
    // Automatically play the sound for the first item
    speak(items[currentIndex]);
  }, [currentIndex, items]);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Dictation</CardTitle>
        <p className="text-gray-500">Listen and type what you hear.</p>
        <Progress value={progress} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button variant="outline" onClick={() => speak(items[currentIndex])} className="w-full">
            <Volume2 className="w-5 h-5 mr-2" /> Play Sound
          </Button>
          <Input
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Type here..."
            className={feedback ? (feedback === 'correct' ? 'border-green-500' : 'border-red-500') : ''}
          />
          {feedback && (
            <div className={`flex items-center p-2 rounded-md ${feedback === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {feedback === 'correct' ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
              {feedback === 'correct' ? 'Correct!' : `Correct answer: ${items[currentIndex]}`}
            </div>
          )}
          <Button onClick={feedback ? handleNext : handleCheck} className="w-full">
            {feedback ? (currentIndex === items.length - 1 ? 'Finish' : 'Next') : 'Check'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// --- Main Study Page Component ---
export default function StudyPage() {
  const router = useRouter();
  const [session, setSession] = useState<StudySession | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem('studySession');
    if (savedSession) {
      setSession(JSON.parse(savedSession));
    } else {
      // If no session is found, maybe redirect to home or documents list
      router.push('/');
    }
  }, [router]);

  const handleComplete = () => {
    setIsFinished(true);
  };

  if (isFinished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <Card className="text-center p-8">
          <CardTitle className="text-3xl font-bold mb-4">🎉 Well Done!</CardTitle>
          <CardContent>
            <p className="text-gray-600 mb-6">You have completed your study session.</p>
            <div className="flex gap-4">
              <Button onClick={() => router.push(`/documents/${session?.documentId}`)}>Review Document</Button>
              <Button variant="outline" onClick={() => router.push('/')}>Go to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return <div className="min-h-screen flex items-center justify-center"><p>Loading study session...</p></div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      {session.type === 'recitation' ? (
        <RecitationInterface items={session.items} onComplete={handleComplete} />
      ) : (
        <DictationInterface items={session.items} onComplete={handleComplete} />
      )}
    </div>
  );
}