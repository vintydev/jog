// Create a new type authstate
import { User as FirebaseUser } from "firebase/auth";
import { User as FirestoreUser } from "./User";

export type AuthState = {
  
  user: FirebaseUser | null 
  userData: FirestoreUser | null;
  loading: boolean;

};
