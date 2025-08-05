import { useState, useEffect } from "react";
import { db } from "@/app/services/FirebaseService";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import useAuth from "@/app/hooks/useAuth";;
import { UserStats } from "../types/UserStats";

export default function useUserStats() {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [todaysLog, setTodaysLog] = useState<Partial<UserStats["jogStats"]["dailyJogStats"][string]> | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString();

  useEffect(() => {
    if (!user?.uid) return;

    const statsRef = collection(db, "userStats");
    const statsQuery = query(statsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(statsQuery, (querySnapshot) => {
      if (querySnapshot.empty) {
        setUserStats(null);
        setTodaysLog(null);
        return;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data() as UserStats;

      setUserStats(data);
      setTodaysLog(data.jogStats?.dailyJogStats?.[today] ?? null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { userStats, todaysLog, loading };
}