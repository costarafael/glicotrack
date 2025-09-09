/**
 * Firebase Modular API Wrapper
 * Provides modern Firebase API while maintaining compatibility
 */

import firestore, { 
  getFirestore, 
  collection as firestoreCollection, 
  doc as firestoreDoc,
  query as firestoreQuery,
  where as firestoreWhere,
  limit as firestoreLimit,
  writeBatch as firestoreWriteBatch,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs
} from '@react-native-firebase/firestore';
import { Platform } from 'react-native';

export class FirebaseModularWrapper {
  private static instance: FirebaseModularWrapper | null = null;
  private firestoreInstance: any = null;

  private constructor() {
    // Initialize Firestore instance using modular API
    try {
      this.firestoreInstance = getFirestore();
    } catch (error: any) {
      console.warn('Failed to initialize Firestore:', error?.message || 'Unknown error');
    }
  }

  public static getInstance(): FirebaseModularWrapper {
    if (!FirebaseModularWrapper.instance) {
      FirebaseModularWrapper.instance = new FirebaseModularWrapper();
    }
    return FirebaseModularWrapper.instance;
  }

  /**
   * Get a collection reference using modular API
   */
  public collection(collectionName: string) {
    try {
      if (!this.firestoreInstance) {
        throw new Error('Firestore not initialized');
      }
      return firestoreCollection(this.firestoreInstance, collectionName);
    } catch (error: any) {
      console.error('Error getting collection:', {
        collection: collectionName,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create a query with where clause using modular API
   */
  public query(collectionRef: any, field: string, operator: any, value: any) {
    try {
      return firestoreQuery(collectionRef, firestoreWhere(field, operator, value));
    } catch (error: any) {
      console.error('Error creating query:', {
        field,
        operator,
        value,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Create a query with limit using modular API
   */
  public queryWithLimit(collectionRef: any, field: string, operator: any, value: any, limitCount: number) {
    try {
      return firestoreQuery(
        collectionRef, 
        firestoreWhere(field, operator, value),
        firestoreLimit(limitCount)
      );
    } catch (error: any) {
      console.error('Error creating query with limit:', {
        field,
        operator,
        value,
        limit: limitCount,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Execute a query with robust error handling
   */
  public async executeQuery(query: any): Promise<any> {
    try {
      if (!query) {
        console.warn('Query is null or undefined');
        return null;
      }

      const result = await getDocs(query);
      return result;
    } catch (error: any) {
      // Safer error handling - avoid accessing undefined properties
      const errorMessage = error && typeof error === 'object' && error.message 
        ? error.message 
        : String(error || 'Unknown error');
      
      const errorCode = error && typeof error === 'object' && error.code 
        ? error.code 
        : 'no-code';
      
      const errorName = error && typeof error === 'object' && error.name 
        ? error.name 
        : 'UnknownError';

      console.error('Query execution error:', {
        message: errorMessage,
        code: errorCode,
        name: errorName,
        errorType: typeof error
      });
      
      // Return null for safe handling instead of throwing
      return null;
    }
  }

  /**
   * Add document using modular API
   */
  public async addDocument(collectionName: string, data: any): Promise<any> {
    try {
      const collectionRef = this.collection(collectionName);
      const result = await addDoc(collectionRef, data);
      return result;
    } catch (error: any) {
      console.error('Add document error:', {
        collection: collectionName,
        error: error?.message || 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Delete document using modular API
   */
  public async deleteDocument(collectionName: string, documentId: string): Promise<boolean> {
    try {
      const docRef = firestoreDoc(this.firestoreInstance, collectionName, documentId);
      await deleteDoc(docRef);
      return true;
    } catch (error: any) {
      console.error('Delete document error:', {
        collection: collectionName,
        document: documentId,
        error: error?.message || 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Update document using modular API
   */
  public async updateDocument(collectionName: string, documentId: string, data: any): Promise<boolean> {
    try {
      const docRef = firestoreDoc(this.firestoreInstance, collectionName, documentId);
      await updateDoc(docRef, data);
      return true;
    } catch (error: any) {
      console.error('Update document error:', {
        collection: collectionName,
        document: documentId,
        error: error?.message || 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get write batch using modular API
   */
  public getWriteBatch() {
    return firestoreWriteBatch(this.firestoreInstance);
  }

  /**
   * Get document reference using modular API
   */
  public doc(collectionName: string, documentId: string) {
    try {
      return firestoreDoc(this.firestoreInstance, collectionName, documentId);
    } catch (error: any) {
      console.error('Error getting document reference:', {
        collection: collectionName,
        document: documentId,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * Test Firebase connectivity
   */
  public async testConnection(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false;
      }

      // Use a simple collection check without query execution
      if (!this.firestoreInstance) {
        return false;
      }
      
      // Use modular API instead of deprecated namespaced API
      const testCollection = firestoreCollection(this.firestoreInstance, '_test');
      return !!testCollection;
    } catch (error: any) {
      console.log('Firebase connection test failed:', {
        error: error?.message || 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Get Firestore instance (legacy support)
   */
  public getFirestore() {
    return this.firestoreInstance;
  }
}

// Export singleton instance
export const firebaseWrapper = FirebaseModularWrapper.getInstance();