import { auth, db } from "./FirebaseService";
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential, Auth, getAuth, fetchSignInMethodsForEmail, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, increment, FieldValue, Timestamp } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import UserService from "./UserService";
import { AuthSelections } from "../types/Navigator";
import { User } from "../types/User";
import * as Google from "expo-auth-session";
import { Alert } from "react-native";
import { sendEmailVerification } from "firebase/auth";
import UserStatsService from "./UserStatsService";
import { UserStats } from "../types/UserStats";
import  Constants from "expo-constants";
import { Platform } from "react-native";



class AuthService {
  static googleAuthProvider: any;

  // Sign Up with Email & Password
  static async signUp(selections: AuthSelections, expoPushToken: string): Promise<UserCredential | null> {

    const { username, email, password, date, gender, adhdDiagnosed, dateDiagnosed, isWaiting, isMedicated, isDiagnosedPrivately, lengthWaiting, medications, employabilityStatus, isStudent, memorySeverity, concentrationSeverity, moodSeverity, isFromGoogle, questionnaireTime } = selections;

    const buildNumber: string = Platform.OS === "ios"
    ? Constants?.expoConfig?.ios?.buildNumber ?? "unknown"
    : Constants?.expoConfig?.android?.version ?? Constants?.expoConfig?.ios?.buildNumber ?? "unknown";
    

    try {

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData: User = {
        userId: user.uid,
        isSignedUp: false,
        isFromGoogle: isFromGoogle,
        displayName: username.trim(),
        gender: gender,
        dateOfBirth: UserService.formatDate(date) ?? null,
        age: UserService.getAge(date),
        email: email?.trim(),

        adhdInfo: {
          isDiagnosed: adhdDiagnosed,
          dateDiagnosed: dateDiagnosed,
          isWaiting: isWaiting,
          isDiagnosedPrivately: isDiagnosedPrivately,
          lengthWaiting: lengthWaiting,

        },

        medicationInfo: {
          isMedicated: isMedicated,
          medications
        },

        occupationInfo: {
          employabilityStatus: employabilityStatus,
          isStudent: isStudent,
        },

        symptomInfo: {
          initialMemorySeverity: memorySeverity,
          initialConcentrationSeverity: concentrationSeverity,
          initialMoodSeverity: moodSeverity,
        },

        createdAt: Timestamp.now(),
        lastLoggedIn: Timestamp.now(),
        isLoggedIn: false,
        logInCount: increment(0),
        isFocusMode: false,
        expoPushToken: null,

      };


      await setDoc(doc(db, "users", user.uid), userData, { merge: true });
      await UserStatsService.initialiseUserStats(user.uid, questionnaireTime ?? undefined, buildNumber);
      await AsyncStorage.setItem("userInfo", JSON.stringify(userData));

      await sendEmailVerification(user);
      await auth.signOut();
      return userCredential;
    } catch (error) {
      console.error("Sign Up Error:", error);
      throw error;
    }
  }

  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<UserCredential | null> {

    return new Promise<UserCredential | null>(async (resolve, reject) => {
      if (!email || !password) {
        reject(new Error("No email or password provided."));
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified && email.toLowerCase() !== "testjog@test.com") {
          reject(new Error("Email not verified"));
          await auth.signOut();
        }

        if (user) {
          await AsyncStorage.setItem("userInfo", JSON.stringify(user));
          await this.updateUserLogin(user.uid)
          await UserStatsService.initialiseUserStats(user.uid);

          resolve(userCredential);
        }
      } catch (error) {
        console.error("Sign In Error:", error);
        reject(error);
      }
    });


  }

  static async changePassword(email: string): Promise<void> {
    try {

      if (!email) {
        throw new Error("Email is required to change password.");
      }

      //check if email exists
      const auth = getAuth();


      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "A password reset email has been sent. Please check your inbox.");
    } catch (error: any) {
      console.error("Error changing password:", error);
      Alert.alert("Error", error.message || "Could not send password reset email.");
    }
  }

  static async resendVerificationEmail(email: string, password: string): Promise<void> {


    try {
      if (!email || !password) {
        throw new Error("Email and password are required to resend verification email.");
      }

      const auth = getAuth();

      // Sign in the user to get access to their account
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user) {
        throw new Error("User not found. Please check your credentials.");
      }

      if (user.emailVerified) {
        Alert.alert("Notice", "Your email is already verified.");
        await auth.signOut();
        return;
      }


      // Send verification email
      await sendEmailVerification(user);
      await auth.signOut();
      Alert.alert("Success", "A verification email has been sent. Please check your inbox.\nIf you don't see it, try your junk folder.");


    } catch (error: any) {
      console.error("Error resending verification email:", error);
      Alert.alert("Error", error.message || "Could not send verification email.");
    }
  }


  static async signInWithGoogle(response: any,expoPushToken: string,userInfo?: Partial<User>): Promise<UserCredential | null> {
    if (!response?.params?.id_token) {
      console.warn("No Google ID token provided.");
      return null;
    }

    try {
      // Sign in with Google ID token
      const credential = GoogleAuthProvider.credential(response.params.id_token);
      const authResult = await signInWithCredential(auth, credential);
      const user = authResult.user;

      if (!user) throw new Error("Google user not found after sign-in.");

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      // Base user profile
      const baseUserData: User = {
        userId: user.uid,
        displayName: user.email?.split("@")[0] || "",
        email: user.email ?? "No email",
        dateOfBirth: null,
        gender: null,
        createdAt: Timestamp.now(),
        lastLoggedIn: Timestamp.now(),
        isLoggedIn: true,
        isFromGoogle: true,
        isSignedUp: false,
        logInCount: increment(1),
        expoPushToken,

        adhdInfo: {
          isDiagnosed: null,
          dateDiagnosed: null,
          isWaiting: null,
          isDiagnosedPrivately: null,
          lengthWaiting: null,
        },
        medicationInfo: {
          isMedicated: null,
          medications: [],
        },
        occupationInfo: {
          employabilityStatus: null,
          isStudent: null,
        },
        symptomInfo: {
          initialMemorySeverity: null,
          initialConcentrationSeverity: null,
          initialMoodSeverity: null,
        },
        age: null,
        isFocusMode: false,
      };

      if (!userSnap.exists()) {
        // New user: Create profile
        const newUserData = { ...baseUserData, ...userInfo };
        await setDoc(userRef, newUserData);
        await UserStatsService.initialiseUserStats(user.uid, );
      } else {
        // Existing user: Update login data
        const updateData = {
          lastLoggedIn: serverTimestamp(),
          isLoggedIn: true,
          logInCount: increment(1),
          expoPushToken,
          ...userInfo,
        };
        await setDoc(userRef, updateData, { merge: true });
      }

      // Local persistence
      await AsyncStorage.setItem("userInfo", JSON.stringify(user));
      await AsyncStorage.removeItem("currentConversationId");

      console.log("Google Sign-In successful and user data handled.");
      return authResult;
    } catch (error) {
      console.error("Google Sign-In Error:", error);
      throw error;
    }
  }

  // Update login info via uid
  static async updateUserLogin(uid: string) {
    try {
      const userRef = doc(db, "users", uid);

      // Update the main user document
      await setDoc(
        userRef,
        {
          lastLoggedIn: serverTimestamp(),
          logInCount: increment(1),
          isLoggedIn: true,
          isSignedUp: true,
        },
        { merge: true }
      );

      // Safely update stats 
      await UserStatsService.updateStats(uid, {
        appUsageStats: {
          totalLogins: increment(1),
        },
      } as Partial<UserStats>);

    } catch (error) {
      console.error("Error updating user login:", error);
    }
  }

  static async logOut(uid: string, showConfirm: boolean = true): Promise<void> {
    if (!uid) throw new Error("No user found");

    const performLogout = async () => {
      try {
        console.log("Logging out user...");

        // Update Firestore user as logged out
        const userRef = doc(db, "users", uid);
        await setDoc(userRef, { isLoggedIn: false }, { merge: true });
        console.log("User marked as logged out in Firestore");

        // Revoke Google token if available
        const googleToken = await AsyncStorage.getItem("googleAccessToken");

        if (googleToken) {
          try {
            await Google.revokeAsync(
              { token: googleToken },
              { revocationEndpoint: "https://oauth2.googleapis.com/revoke" }
            );
            console.log("Google access revoked");
            await AsyncStorage.removeItem("googleAccessToken");
          } catch (revokeError) {
            console.warn("Failed to revoke Google token", revokeError);
          }
        }

        // Clear local storage
        await AsyncStorage.multiRemove(["userInfo", "currentConversationId"]);
        console.log("Local storage cleared");

        // Sign out from Firebase Auth
        await signOut(auth);
        console.log("Firebase signed out");

      } catch (error) {
        console.error("Logout error:", error);
        throw new Error("Failed to log out properly.");
      }
    };

    if (showConfirm) {
      return new Promise<void>((resolve, reject) => {
        Alert.alert("Confirm Logout", "Are you sure you want to log out?", [
          {
            text: "Cancel",
            style: "cancel",
            onPress: () => {
              console.log("Logout cancelled");
              resolve();
            },
          },
          {
            text: "Log Out",
            style: "destructive",
            onPress: async () => {
              try {
                await performLogout();
                resolve();
              } catch (e) {
                reject(e);
              }
            },
          },
        ]);
      });
    } else {
      await performLogout();
    }
  }
}

export default AuthService;