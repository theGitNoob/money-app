import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface UserSettings {
  currency: string;
  notifications: {
    email: boolean;
    push: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  budgetAlerts: boolean;
  theme: string;
  timezone: string;
}

export const saveUserSettings = async (userId: string, settings: UserSettings) => {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    await setDoc(userSettingsRef, settings, { merge: true });
  } catch (error) {
    console.error("Error saving user settings: ", error);
    throw new Error("Failed to save settings.");
  }
};

export const loadUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    const userSettingsRef = doc(db, 'userSettings', userId);
    const docSnap = await getDoc(userSettingsRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserSettings;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error loading user settings: ", error);
    throw new Error("Failed to load settings.");
  }
};
