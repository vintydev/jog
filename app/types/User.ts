// Create new User interface with properties for user data

import { Timestamp } from "firebase/firestore"
import { FieldValue } from "firebase/firestore"

export interface User {

    userId: string | null 
    isFromGoogle: boolean
    isSignedUp: boolean
    isFocusMode: boolean
    displayName: string | null 
    expoPushToken?: string | null
    email: string | null 
    gender: string | null 
    dateOfBirth: string | null
    age: number  | null
    createdAt: Timestamp | null
    lastLoggedIn: Timestamp | null 
    isLoggedIn: boolean 
    logInCount: FieldValue | null 
    adhdInfo: {
        isDiagnosed: boolean | null
        dateDiagnosed: string | null
        isWaiting: boolean | null
        isDiagnosedPrivately: boolean | null
        lengthWaiting: string | null
    }
    medicationInfo: {
        isMedicated: boolean | null
        medications: { name: string; dosage: string;}[]
    }
    occupationInfo: {
        employabilityStatus: string | null
        isStudent: boolean | null
    }
    symptomInfo: {
        initialMemorySeverity: number | null
        initialConcentrationSeverity: number | null
        initialMoodSeverity: number | null
    }


}