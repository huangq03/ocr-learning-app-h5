'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { signOut } from '@/lib/actions';

interface ProfileInterfaceProps {
  user: User;
  initialStats: any;
}

export default function ProfileInterface({ user, initialStats }: ProfileInterfaceProps) {
  const router = useRouter();
  const [stats, setStats] = useState(initialStats);

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Profile</h1>
          <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
        </div>

        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <p><span className="font-semibold">Email:</span> {user.email}</p>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-2xl font-bold">{stats.totalDocuments}</p>
              <p className="text-sm text-gray-600">Total Documents</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-2xl font-bold">{stats.totalItems}</p>
              <p className="text-sm text-gray-600">Total Items</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-2xl font-bold">{stats.itemsDue}</p>
              <p className="text-sm text-gray-600">Items Due Today</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-2xl font-bold">{stats.masteredItems}</p>
              <p className="text-sm text-gray-600">Mastered Items</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-2xl font-bold">{stats.currentStreak}</p>
              <p className="text-sm text-gray-600">Day Streak</p>
            </div>
            <div className="p-4 bg-gray-100 rounded-lg">
              <p className="text-2xl font-bold">{stats.studyTimeHours}</p>
              <p className="text-sm text-gray-600">Study Hours</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
