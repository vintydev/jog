import { useState, useEffect } from "react";
import { db } from "@/app/services/FirebaseService";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import useAuth from "@/app/hooks/useAuth";;

// Create a new type for the options
type UseRemindersOptions = {
  today?: Timestamp;
  weekStart?: Date;
};

// Create a new function that accepts different filters for reminders
export default function useReminders(options: UseRemindersOptions = {}) {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<any[]>([]);
  const { today, weekStart } = options;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);

    const remindersRef = collection(db, "reminders");
    let remindersQuery;

    if (today) {
      const jsDate = today.toDate();
      const startOfDay = Timestamp.fromDate(new Date(jsDate.setHours(0, 0, 0, 0)));
      const endOfDay = Timestamp.fromDate(new Date(jsDate.setHours(23, 59, 59, 999)));

      remindersQuery = query(
        remindersRef,
        where("userId", "==", user.uid),
        where("dueDate", ">=", startOfDay),
        where("dueDate", "<=", endOfDay)
      );
    } else if (weekStart) {
      const start = new Date(weekStart);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);

      const startTimestamp = Timestamp.fromDate(start);
      const endTimestamp = Timestamp.fromDate(end);

      remindersQuery = query(
        remindersRef,
        where("userId", "==", user.uid),
        where("dueDate", ">=", startTimestamp),
        where("dueDate", "<=", endTimestamp)
      );
    } else {
      // Fetch all user reminders
      remindersQuery = query(
        remindersRef,
        where("userId", "==", user.uid)
      );
    }

    const unsubscribe = onSnapshot(remindersQuery, (querySnapshot) => {
      const fetchedTasks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setReminders(fetchedTasks);
    });
    setLoading(false);

    return () => unsubscribe();
  }, [user, today, weekStart]);

  return { reminders, loading };
}