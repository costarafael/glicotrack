/**
 * Firebase Email Recovery Service
 * Manages email recovery data in Firebase Firestore
 */

import firestore, { 
  getDoc,
  setDoc
} from '@react-native-firebase/firestore';
import { MMKV } from 'react-native-mmkv';
import { Platform } from 'react-native';
import { firebaseWrapper } from './firebase/FirebaseModularWrapper';

interface EmailRecoveryData {
  email: string;
  emailHash: string;
  userKey: string;
  createdAt: Date;
  updatedAt: Date;
  verified: boolean;
}

class FirebaseEmailService {
  private storage: MMKV;
  private readonly COLLECTION_NAME = 'email_recovery';
  private firebaseAvailable: boolean = false;

  constructor() {
    this.storage = new MMKV();
    this.checkFirebaseAvailability();
  }

  /**
   * Check if Firebase is available
   */
  private async checkFirebaseAvailability(): Promise<boolean> {
    try {
      // Only Firebase native is available on Android
      if (Platform.OS === 'android') {
        // Import Firebase dynamically to avoid load errors
        const { default: firestore } = await import('@react-native-firebase/firestore');
        
        // Test Firebase connection using wrapper to avoid deprecation warnings
        const testQuery = await firebaseWrapper.testConnection();
        this.firebaseAvailable = true;
        console.log('✅ Firebase available for email recovery');
      } else {
        // iOS uses Web SDK which doesn't have these warnings
        console.log('📱 iOS - Firebase email recovery disabled (using Web SDK for main sync)');
        this.firebaseAvailable = false;
      }
    } catch (error: any) {
      console.log('⚠️ Firebase not available for email recovery:', error?.message || error);
      this.firebaseAvailable = false;
    }
    return this.firebaseAvailable;
  }

  /**
   * Simple hash function for email
   */
  private hashEmail(email: string): string {
    const str = email.toLowerCase().trim();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'email_' + Math.abs(hash).toString(36);
  }

  /**
   * Store email-key association in Firebase
   */
  async storeEmailRecovery(email: string, userKey: string): Promise<boolean> {
    try {
      // Check Firebase availability first
      if (Platform.OS !== 'android' || !this.firebaseAvailable) {
        await this.checkFirebaseAvailability();
        if (!this.firebaseAvailable) {
          console.log('📱 Email recovery not available - Firebase not initialized');
          return false;
        }
      }

      const emailHash = this.hashEmail(email);
      
      // Check if email already exists for another user
      const docRef = firebaseWrapper.doc(this.COLLECTION_NAME, emailHash);
      const existingEmail = await getDoc(docRef);

      if (existingEmail.exists()) {
        const data = existingEmail.data();
        if (data?.userKey && data.userKey !== userKey) {
          console.log('Email already registered to another user');
          return false;
        }
      }

      // Store the email recovery data using wrapper
      const currentDate = new Date();
      const existingCreatedAt = existingEmail.exists() ? existingEmail.data()?.createdAt : null;
      
      const docRefForSet = firebaseWrapper.doc(this.COLLECTION_NAME, emailHash);
      await setDoc(docRefForSet, {
          email: email.toLowerCase().trim(),
          emailHash,
          userKey,
          verified: true,
          updatedAt: currentDate,
          createdAt: existingCreatedAt || currentDate,
        });

      console.log('✅ Email recovery stored in Firebase:', emailHash);
      return true;
    } catch (error: any) {
      console.error('❌ Error storing email recovery:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'no-code'
      });
      return false;
    }
  }

  /**
   * Get user key by email from Firebase
   */
  async getUserKeyByEmail(email: string): Promise<string | null> {
    try {
      // Check Firebase availability first
      if (Platform.OS !== 'android' || !this.firebaseAvailable) {
        await this.checkFirebaseAvailability();
        if (!this.firebaseAvailable) {
          console.log('📱 Email lookup not available - Firebase not initialized');
          return null;
        }
      }

      const emailHash = this.hashEmail(email);
      
      const docRef = firebaseWrapper.doc(this.COLLECTION_NAME, emailHash);
      const doc = await getDoc(docRef);

      if (doc.exists()) {
        const data = doc.data();
        console.log('✅ Found user key for email:', data?.userKey);
        return data?.userKey || null;
      }

      console.log('❌ No user key found for email');
      return null;
    } catch (error: any) {
      console.error('❌ Error getting user key by email:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'no-code'
      });
      return null;
    }
  }

  /**
   * Remove email recovery from Firebase
   */
  async removeEmailRecovery(userKey: string): Promise<boolean> {
    try {
      // Check Firebase availability first
      if (Platform.OS !== 'android' || !this.firebaseAvailable) {
        await this.checkFirebaseAvailability();
        if (!this.firebaseAvailable) {
          console.log('📱 Email removal not available - Firebase not initialized');
          return false;
        }
      }

      // Find email by userKey using wrapper
      const collectionRef = firebaseWrapper.collection(this.COLLECTION_NAME);
      const query = firebaseWrapper.query(collectionRef, 'userKey', '==', userKey);
      const querySnapshot = await firebaseWrapper.executeQuery(query);

      if (!querySnapshot.empty) {
        // Delete all matching documents using wrapper
        const batch = firebaseWrapper.getWriteBatch();
        querySnapshot.forEach(doc => {
          batch.delete(doc.ref);
        });
        await batch.commit();
        
        console.log('✅ Email recovery removed from Firebase');
        return true;
      }

      console.log('⚠️ No email recovery found to remove');
      return false;
    } catch (error: any) {
      console.error('❌ Error removing email recovery:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'no-code'
      });
      return false;
    }
  }

  /**
   * Get email by user key from Firebase
   */
  async getEmailByUserKey(userKey: string): Promise<string | null> {
    try {
      // Check Firebase availability first
      if (Platform.OS !== 'android' || !this.firebaseAvailable) {
        await this.checkFirebaseAvailability();
        if (!this.firebaseAvailable) {
          console.log('📱 Email lookup not available - Firebase not initialized');
          return null;
        }
      }

      // Check if userKey is valid
      if (!userKey || userKey.trim() === '') {
        console.log('⚠️ Invalid user key provided');
        return null;
      }

      // Use modern Firebase wrapper to avoid deprecated API warnings
      const collectionRef = firebaseWrapper.collection(this.COLLECTION_NAME);
      const query = firebaseWrapper.queryWithLimit(collectionRef, 'userKey', '==', userKey, 1);
      const querySnapshot = await firebaseWrapper.executeQuery(query);

      if (!querySnapshot) {
        return null;
      }

      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        console.log('✅ Found email for user key:', data?.email);
        return data?.email || null;
      }

      console.log('⚠️ No email found for user key');
      return null;
    } catch (error: any) {
      // More detailed error logging with safer property access
      console.error('❌ Error getting email by user key:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'no-code',
        name: error?.name || 'UnknownError',
        toString: error?.toString?.() || 'No string representation'
      });
      return null;
    }
  }

  /**
   * Check if email is already registered
   */
  async isEmailRegistered(email: string): Promise<boolean> {
    try {
      // Check Firebase availability first
      if (Platform.OS !== 'android' || !this.firebaseAvailable) {
        await this.checkFirebaseAvailability();
        if (!this.firebaseAvailable) {
          console.log('📱 Email check not available - Firebase not initialized');
          return false;
        }
      }

      const emailHash = this.hashEmail(email);
      
      const docRef = firebaseWrapper.doc(this.COLLECTION_NAME, emailHash);
      const doc = await getDoc(docRef);

      return doc.exists() && doc.data()?.verified === true;
    } catch (error: any) {
      console.error('❌ Error checking email registration:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'no-code'
      });
      return false;
    }
  }

  /**
   * Save email for recovery (alias for storeEmailRecovery)
   */
  async saveEmailForRecovery(userKey: string, email: string): Promise<boolean> {
    return await this.storeEmailRecovery(email, userKey);
  }

  /**
   * Update email for recovery (delete old, add new atomically)
   */
  async updateEmailForRecovery(userKey: string, oldEmail: string, newEmail: string): Promise<boolean> {
    return await this.updateEmail(oldEmail, newEmail, userKey);
  }

  /**
   * Remove email for recovery (alias for removeEmailRecovery)
   */
  async removeEmailForRecovery(userKey: string): Promise<boolean> {
    return await this.removeEmailRecovery(userKey);
  }

  /**
   * Update email for user - uses atomic transaction to prevent duplicates
   */
  async updateEmail(oldEmail: string, newEmail: string, userKey: string): Promise<boolean> {
    try {
      console.log('🔄 [updateEmail] Starting email update process...');
      console.log(`🔄 [updateEmail] Old: ${oldEmail} -> New: ${newEmail} for user: ${userKey}`);
      
      // Check Firebase availability first
      if (Platform.OS !== 'android' || !this.firebaseAvailable) {
        await this.checkFirebaseAvailability();
        if (!this.firebaseAvailable) {
          console.log('📱 Email update not available - Firebase not initialized');
          return false;
        }
      }

      // Check if old email exists before update
      if (oldEmail) {
        const oldEmailHash = this.hashEmail(oldEmail);
        console.log(`🔍 [updateEmail] Checking if old email exists: ${oldEmailHash}`);
        const oldDocRef = firebaseWrapper.doc(this.COLLECTION_NAME, oldEmailHash);
        const oldDoc = await getDoc(oldDocRef);
        if (oldDoc.exists()) {
          console.log('✅ [updateEmail] Old email found in Firebase, will be deleted');
          console.log(`📋 [updateEmail] Old email data:`, oldDoc.data());
        } else {
          console.log('⚠️ [updateEmail] Old email not found in Firebase');
        }
      }

      // Check if new email already exists for another user
      const newEmailHash = this.hashEmail(newEmail);
      console.log(`🔍 [updateEmail] New email hash: ${newEmailHash}`);
      const newEmailDocRef = firebaseWrapper.doc(this.COLLECTION_NAME, newEmailHash);
      const newEmailDoc = await getDoc(newEmailDocRef);
      
      if (newEmailDoc.exists()) {
        const data = newEmailDoc.data();
        if (data?.userKey && data.userKey !== userKey) {
          console.log('❌ New email already registered to another user');
          return false;
        } else {
          console.log('⚠️ [updateEmail] New email exists but belongs to same user');
        }
      } else {
        console.log('✅ [updateEmail] New email is available');
      }

      // Use batch operation for atomic update (delete old + add new)
      console.log('🚀 [updateEmail] Creating batch operation...');
      const batch = firebaseWrapper.getWriteBatch();

      // Remove old email if exists
      if (oldEmail) {
        const oldEmailHash = this.hashEmail(oldEmail);
        const oldDocRef = firebaseWrapper.doc(this.COLLECTION_NAME, oldEmailHash);
        batch.delete(oldDocRef);
        console.log('🗑️ [updateEmail] Scheduled old email deletion:', oldEmailHash);
      }

      // Add new email
      const newDocRef = firebaseWrapper.doc(this.COLLECTION_NAME, newEmailHash);
      const currentDate = new Date();
      batch.set(newDocRef, {
        email: newEmail.toLowerCase().trim(),
        emailHash: newEmailHash,
        userKey,
        verified: true,
        updatedAt: currentDate,
        createdAt: currentDate,
      });
      console.log('➕ [updateEmail] Scheduled new email creation:', newEmailHash);

      // Execute batch atomically
      console.log('⚡ [updateEmail] Committing batch operation...');
      await batch.commit();
      console.log('✅ [updateEmail] Email update completed atomically');
      
      // Verify the operation succeeded
      console.log('🔍 [updateEmail] Verifying batch operation results...');
      
      // Check old email was deleted
      if (oldEmail) {
        const oldEmailHash = this.hashEmail(oldEmail);
        const oldDocRef = firebaseWrapper.doc(this.COLLECTION_NAME, oldEmailHash);
        const oldVerifyDoc = await getDoc(oldDocRef);
        if (oldVerifyDoc.exists()) {
          console.error('❌ [updateEmail] CRITICAL: Old email still exists after batch commit!');
          console.error('❌ [updateEmail] Old email data:', oldVerifyDoc.data());
        } else {
          console.log('✅ [updateEmail] Verified: Old email successfully deleted');
        }
      }
      
      // Check new email was created
      const newVerifyDoc = await getDoc(newEmailDocRef);
      if (newVerifyDoc.exists()) {
        console.log('✅ [updateEmail] Verified: New email successfully created');
        console.log('📋 [updateEmail] New email data:', newVerifyDoc.data());
      } else {
        console.error('❌ [updateEmail] CRITICAL: New email was not created!');
      }
      
      return true;

    } catch (error: any) {
      console.error('❌ [updateEmail] Error updating email:', {
        message: error?.message || 'Unknown error',
        code: error?.code || 'no-code',
        stack: error?.stack || 'No stack trace'
      });
      return false;
    }
  }
}

export default new FirebaseEmailService();