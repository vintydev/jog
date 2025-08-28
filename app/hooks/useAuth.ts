import { useEffect, useState } from "react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../services/FirebaseService";
import { User as FirestoreUser } from "../types/User";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { registerForPushNotificationsAsync } from "../utils/registerForPushNotificationsAsync";
import * as Device from "expo-device";

export default function useAuth() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUserSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);

      if (!authenticatedUser) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, "users", authenticatedUser.uid);
      
      
  
      // Set up real-time listener regardless of token
      unsubscribeUserSnapshot = onSnapshot(userRef, async (docSnapshot) => {
        if (!docSnapshot.exists()) {
          setUserData(null);
          return;
        }

        const newUserData = docSnapshot.data() as FirestoreUser;
        setUserData(newUserData );

        // Register push token only once if needed
        if ((!newUserData.expoPushToken || !userData?.expoPushToken) && Device.isDevice) {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await updateDoc(userRef, { expoPushToken: pushToken });
          }
        }
      });

      setTimeout(() => {
        setLoading(false);
      }, 1000); 
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserSnapshot) unsubscribeUserSnapshot();
    };
  }, []);

  return { user, userData, loading };
}