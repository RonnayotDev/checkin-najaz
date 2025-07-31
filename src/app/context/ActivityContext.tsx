'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type ActivityType = 'checkin' | 'leave' | 'payment';

export interface ActivityRecord {
  type: ActivityType;
  date: string; // ISO string เช่น '2025-07-31'
  amount?: number; // สำหรับ payment
}

interface ActivityContextType {
  activities: Record<string, ActivityRecord[]>; // key = username
  addActivity: (username: string, record: ActivityRecord) => void;
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [activities, setActivities] = useState<Record<string, ActivityRecord[]>>({});

  const addActivity = (username: string, record: ActivityRecord) => {
    setActivities((prev) => {
      const userActs = prev[username] || [];
      return {
        ...prev,
        [username]: [...userActs, record],
      };
    });
  };

  return (
    <ActivityContext.Provider value={{ activities, addActivity }}>
      {children}
    </ActivityContext.Provider>
  );
}

export function useActivity() {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within ActivityProvider');
  return ctx;
}
