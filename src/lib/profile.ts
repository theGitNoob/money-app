import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface UserProfile {
  name: string;
  email: string;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
}

export const saveUserProfile = async (userId: string, profile: Partial<UserProfile>) => {
  try {
    const userProfileRef = doc(db, 'users', userId);
    await setDoc(userProfileRef, { ...profile, updatedAt: serverTimestamp() }, { merge: true });
  } catch (error) {
    console.error("Error saving user profile: ", error);
    throw new Error("Failed to save profile.");
  }
};

export const loadUserProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const userProfileRef = doc(db, 'users', userId);
    const docSnap = await getDoc(userProfileRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error loading user profile: ", error);
    throw new Error("Failed to load profile.");
  }
};

export const createUserProfile = async (userId: string, email: string, name?: string, photoURL?: string) => {
    try {
        const userProfileRef = doc(db, 'users', userId);
        const profile: UserProfile = {
            name: name || email,
            email: email,
            photoURL: photoURL || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };
        await setDoc(userProfileRef, profile);
        return profile;
    } catch (error) {
        console.error("Error creating user profile: ", error);
        throw new Error("Failed to create user profile.");
    }
}
