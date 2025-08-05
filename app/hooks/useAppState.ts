import { AppState, AppStateStatus } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import UserStatsService from '../services/UserStatsService';
import { useAuthContext } from '../contexts/AuthContext';
import useUserStats from './useUserStats';
import { UserStats } from '../types/UserStats';
import { increment } from 'firebase/firestore';

const useAppState = () => {
  const [isAppInForeground, setIsAppInForeground] = useState(AppState.currentState === 'active');
  const appStateRef = useRef<AppStateStatus>();
  const sessionStartRef = useRef<number | null>(AppState.currentState === 'active' ? Date.now() : null);
  const hasUpdatedThisSession = useRef<boolean>(false);

  const { user } = useAuthContext();
  const { userStats } = useUserStats();

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (appStateRef.current === nextAppState) return;

      const isForeground = nextAppState === 'active';
      setIsAppInForeground(isForeground);

      if (isForeground) {
        sessionStartRef.current = Date.now();
        hasUpdatedThisSession.current = false; // Reset flag on new session
      } else {
        const sessionEnd = Date.now();
        const sessionStart = sessionStartRef.current;

        if (sessionStart && !hasUpdatedThisSession.current && user) {
            
          const sessionDuration = (sessionEnd - sessionStart) / 60000;



          if (sessionDuration < 0.1) return;

          const currentTotalTime = userStats?.appUsageStats?.totalTimeSpent || 0;
          const currentTotalSessions = userStats?.appUsageStats?.totalSessions || 0;

          const newTotalTime = currentTotalTime + sessionDuration;
          const newTotalSessions = increment(1);
          const newAverage = newTotalTime / ((typeof currentTotalSessions === 'number' ? currentTotalSessions : 0) + 1);

          try {
            await UserStatsService.updateStats(user.uid, {
              appUsageStats: {
                totalTimeSpent: newTotalTime,
                totalSessions: newTotalSessions,
                avgTimeSpentPerSession: newAverage,
              },
            } as Partial<UserStats>);

            hasUpdatedThisSession.current = true; 

          } catch (error) {
            console.error('Error updating user stats:', error);
          }
        }
      }

      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [user, userStats]);

  return { isAppInForeground };
};

export default useAppState;