import { getFirestore, doc, setDoc, getDoc, serverTimestamp, collection, updateDoc, deleteDoc, Timestamp, increment, query, where, getDocs } from "firebase/firestore";
import { User } from "../types/User";
import { app, auth } from "./FirebaseService"; // Ensure Firebase is initialized properly
import { getAuth, GoogleAuthProvider, UserCredential, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import AuthService from "./AuthService";
import { AuthSelections } from "../types/Navigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import * as Google from "expo-auth-session";
import { db } from "./FirebaseService";


// Class to handle Firestore User operations
class UserService {

  static async seedTestUser(): Promise<User> {

    const testUser: User = {
      userId: "testjog123",
      isFromGoogle: false,
      isSignedUp: true,
      isFocusMode: false,
      displayName: "Test Jogger",
      expoPushToken: "ExponentPushToken[testing-push-token]",
      email: "testjog@test.com",
      gender: "Other",
      dateOfBirth: "1999-01-01",
      age: 25,
      createdAt: Timestamp.fromDate(new Date("2024-01-01")),
      lastLoggedIn: Timestamp.fromDate(new Date()),
      isLoggedIn: true,
      logInCount: increment(1),

      adhdInfo: {
        isDiagnosed: true,
        dateDiagnosed: "2023-06-15",
        isWaiting: false,
        isDiagnosedPrivately: false,
        lengthWaiting: "",
      },

      medicationInfo: {
        isMedicated: true,
        medications: [
          { name: "Methylphenidate", dosage: "10mg" },
          { name: "Lisdexamfetamine", dosage: "30mg" },
        ],
      },

      occupationInfo: {
        employabilityStatus: "Part-Time",
        isStudent: true,
      },

      symptomInfo: {
        initialMemorySeverity: 2,
        initialConcentrationSeverity: 3,
        initialMoodSeverity: 1,
      },
    };

    try {
      if (!testUser.userId) {
        throw new Error("User ID is null or undefined.");
      }
      const userRef = doc(db, "users", testUser.userId);
      await setDoc(userRef, testUser, { merge: true });
      console.log("Test user seeded successfully.");
    } catch (error) {
      console.error("Error seeding test user:", error);
    }
    return testUser;
  }


  // Method to get user data from Firestore
  static async getUser(uid: string): Promise<User | null> {
    try {

      const userRef = doc(db, "users", uid);
      const docSnap = await getDoc(userRef);

      if (docSnap.exists()) {
        return docSnap.data() as User;
      } else {
        console.log("User not found in Firestore.");
        return null;
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      return null;
    }
  }

  static async sendFeedback(userId: string, feedbackType: string, feedback: string): Promise<void> {
    try {
      const feedbackRef = collection(db, "feedback");
      const newFeedbackRef = doc(feedbackRef);
      const feedbackData = {
        userId,
        feedback,
        feedbackType,
        feedbackId: newFeedbackRef.id,
        timestamp: serverTimestamp(),
      };
      await setDoc(newFeedbackRef, feedbackData);

      console.log("Feedback sent successfully.");
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  }

  static async updateUserInformation(uid: string, data: AuthSelections): Promise<void> {

    const auth = getAuth();
    const user = auth.currentUser;
    console.log("User:", user);

    const userInfo: User = {
      userId: user?.uid as string,
      isFromGoogle: data.isFromGoogle,
      isSignedUp: true,
      displayName: data.username,
      gender: data.gender,
      dateOfBirth: this.formatDate(data.date),
      age: this.getAge(data.date),
      createdAt: Timestamp.now(),
      lastLoggedIn: Timestamp.now(),
      medicationInfo: {
        isMedicated: data.isMedicated,
        medications: data.medications
      },
      occupationInfo: {
        employabilityStatus: data.employabilityStatus,
        isStudent: data.isStudent
      },
      adhdInfo: {
        isDiagnosed: data.adhdDiagnosed,
        dateDiagnosed: data.dateDiagnosed,
        isWaiting: data.isWaiting,
        isDiagnosedPrivately: data.isDiagnosedPrivately,
        lengthWaiting: data.lengthWaiting
      },
      symptomInfo: {
        initialMemorySeverity: data.memorySeverity,
        initialConcentrationSeverity: data.concentrationSeverity,
        initialMoodSeverity: data.moodSeverity
      },
      email: user?.email || null,
      isLoggedIn: true,
      logInCount: increment(1),
      expoPushToken: null,
      isFocusMode: false
    }

    try {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, userInfo, { merge: true });
    } catch (error) {
      console.error("Error updating user information:", error);
    }
  }


  static getAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);

    let age = today.getFullYear() - birthDate.getFullYear();
    const month = today.getMonth() - birthDate.getMonth();

    if (month < 0 || (month === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  static async deleteAccount() {
    const user = getAuth().currentUser;

    if (!user) {
      Alert.alert("Error", "No user is currently signed in.");
      return;
    }

    try {

      if (user.providerData[0]?.providerId === "google.com") {

        const googleToken = await AsyncStorage.getItem("googleAccessToken");
        if (googleToken) {
          const credential = GoogleAuthProvider.credential(null, googleToken);
          await reauthenticateWithCredential(user, credential);

        } else {
          throw new Error("Google token not found. Please log in again.");
        }
      } else {

        console.log("Email/Password user detected. Skipping manual reauthentication.");
      }

      // First delete the user's data
      const reminderDocs = query(collection(db, "reminders"), where("userId", "==", user.uid));
      const reminderSnap = await getDocs(reminderDocs);
      await Promise.all(reminderSnap.docs.map(async (doc) => {
        await deleteDoc(doc.ref);
      }));

      // Then delete the user's other data
      const conversationDocs = query(collection(db, "conversations"), where("userId", "==", user.uid));
      const conversationSnap = await getDocs(conversationDocs);
      await Promise.all(conversationSnap.docs.map(async (doc) => {
        await deleteDoc(doc.ref);
      }));

      const userStatsDocs = query(collection(db, "userStats"), where("userId", "==", user.uid));
      const userStatsSnap = await getDocs(userStatsDocs);
      await Promise.all(userStatsSnap.docs.map(async (doc) => {
        await deleteDoc(doc.ref);
      }));


      const userRef = doc(db, "users", user.uid);
      await deleteDoc(userRef);
      console.log("Firestore user data deleted");

      await deleteUser(user);

      if (user.providerData[0]?.providerId === "google.com") {

        const googleToken = await AsyncStorage.getItem("googleAccessToken");
        if (googleToken) {
          await Google.revokeAsync(
            { token: googleToken },
            { revocationEndpoint: "https://oauth2.googleapis.com/revoke" }
          );
          console.log("Google account access revoked");
        }
      }

      await AsyncStorage.clear();
      console.log("Local storage cleared");

      Alert.alert("Account Deleted", "Your account and associated data have been successfully deleted.");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      if (error.code === "auth/requires-recent-login") {
        Alert.alert(
          "Reauthentication Required",
          "Your session has expired. Please log in again to delete your account."
        );
      } else {
        Alert.alert("Error", error.message);
      }
    }
  }

  static async addMedicationToUser(userId: string, medicationName: string, dosage: string) {
    try {
      if (!userId) throw new Error("⚠️ User ID is missing.");
      if (!medicationName.trim() || !dosage.trim()) {
        console.warn("Medication name or dosage is missing, skipping update.");
        return;
      }

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      let existingMedications = userSnap.exists()
        ? userSnap.data().medicationInfo?.medications || []
        : [];

      const newMedication = { name: medicationName, dosage: dosage };

      // Avoid adding duplicate medications
      if (!existingMedications.some((med: { name: string; dosage: string }) =>
        med.name === newMedication.name && med.dosage === newMedication.dosage)) {
        existingMedications.push(newMedication);
      }

      await setDoc(
        userRef,
        { medicationInfo: { isMedicated: true, medications: existingMedications } },
        { merge: true }
      );

      console.log("Medication successfully added.");
    } catch (error) {
      console.error("Error adding medication:", error);
    }
  }

  static async updateData(userId: string, data: Partial<User>): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, data);
      console.log("User data updated successfully.");
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  }



  static async fetchMedicationByUser(userId: string) {
    try {
      if (!userId) throw new Error("⚠️ User ID is missing.");
      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData.medicationInfo?.isMedicated && userData.medicationInfo?.medications) {
          return userData.medicationInfo.medications;
        }
      }
    } catch (error) {
      console.error("Error fetching user medications:", error);
    }
  }

  static async updateUserProfile(userId: string, updatedData: any) {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, updatedData);
      console.log("User profile updated successfully.");
    } catch (error) {
      console.error(" Error updating user profile:", error);
    }
  }

  static formatDate(date: Date): string {
    if (!date) return "";

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  }


  // static async addMedication(uid: string | null, medications: {} |, isMedicated: boolean | null): Promise<void> {
  //   try {

  //     if(!uid) {
  //       console.log("User not found in Firestore.");
  //       return;
  //     }


  //     const userRef = doc(db, "users", uid);
  //     const docSnap = await getDoc(userRef);

  //     // Create a new collection for medications
  //     const medicationsRef = collection(userRef, "medications");

  //     const newMedicationRef = doc(medicationsRef);

  //     await setDoc(newMedicationRef, { medications, isMedicated });


  //   } catch (error) {
  //     console.error("Error adding medication:", error);
  //   }
  // }

  // static async addOccupation(uid: string, occupation: string | null, isStudent: boolean | null): Promise<void> {
  //   try {
  //     const userRef = doc(db, "users", uid);
  //     const docSnap = await getDoc(userRef);

  //     if(!docSnap.exists()) {
  //       console.log("User not found in Firestore.");
  //       return;
  //     }

  //     // Create a new collection for occupations
  //     const occupationRef = collection(userRef, "occupations");

  //     const newOccupationRef = doc(occupationRef);

  //     await setDoc(newOccupationRef, { occupation, isStudent });


  //   } catch (error) {
  //     console.error("Error adding occupation:", error);
  //   }
  // }

  // static async addADHDInfo(uid: string, isDiagnosed: boolean | null,  dateDiagnosed: string | null, isWaiting: boolean | null, isDiagnosedPrivately: boolean | null, lengthWaiting: string | null): Promise<void> {
  //   try {
  //     const userRef = doc(db, "users", uid);
  //     const docSnap = await getDoc(userRef);

  //     // Create a new collection for ADHD info
  //     const adhdRef = collection(userRef, "adhd");

  //     const newADHDRef = doc(adhdRef);

  //     await setDoc(newADHDRef, { isDiagnosed, dateDiagnosed, isWaiting, isDiagnosedPrivately, lengthWaiting });


  //   } catch (error) {
  //     console.error("Error adding ADHD info:", error);
  //   }
  // }

  // static async addSymptomInfo(uid: string, memorySeverity: string | null, concentrationSeverity: string | null , moodSeverity: string | null): Promise<void> {
  //   try {
  //     const userRef = doc(db, "users", uid);
  //     const docSnap = await getDoc(userRef);

  //     // Create a new collection for symptoms
  //     const symptomsRef = collection(userRef, "symptoms");

  //     const newSymptomsRef = doc(symptomsRef);

  //     await setDoc(newSymptomsRef, { memorySeverity, concentrationSeverity, moodSeverity });


  //   } catch (error) {
  //     console.error("Error adding symptom info:", error);
  //   }
  // }


}


export default UserService;