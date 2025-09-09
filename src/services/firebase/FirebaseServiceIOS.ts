/**
 * FirebaseServiceIOS - Implementação usando React Native Firebase (nativo)
 * Migrado para usar @react-native-firebase para consistência com Android
 */

import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { FirebaseServiceInterface } from './FirebaseServiceInterface';

export class FirebaseServiceIOS implements FirebaseServiceInterface {
  private currentUser: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Firebase iOS já inicializado');
      return;
    }

    try {
      console.log('🔥 [iOS] Inicializando Firebase nativo...');
      
      // Verificar se já há usuário autenticado
      this.currentUser = auth().currentUser;
      
      if (!this.currentUser) {
        console.log('🔐 [iOS] Fazendo login anônimo...');
        const userCredential = await auth().signInAnonymously();
        this.currentUser = userCredential.user;
        console.log('✅ [iOS] Login anônimo realizado:', this.currentUser.uid);
      } else {
        console.log('✅ [iOS] Usuário já autenticado:', this.currentUser.uid);
      }

      // Configurar Firestore para funcionar offline
      console.log('💾 [iOS] Configurando Firestore offline...');
      await firestore().settings({
        persistence: true,
        cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
      });
      console.log('✅ [iOS] Cache offline configurado');
      
      this.isInitialized = true;
      console.log('🔥 [iOS] Firebase nativo inicializado com sucesso!');
      
    } catch (error) {
      console.error('❌ [iOS] Erro ao inicializar Firebase:', error);
      throw error;
    }
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  getCurrentUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  getFirestoreInstance(): any {
    return firestore();
  }

  getAuthInstance(): any {
    return auth();
  }

  async signInAnonymously(): Promise<any> {
    const userCredential = await auth().signInAnonymously();
    this.currentUser = userCredential.user;
    return userCredential;
  }

  async signOut(): Promise<void> {
    await auth().signOut();
    this.currentUser = null;
  }

  // Helpers para collections
  collection(path: string): any {
    return firestore().collection(path);
  }

  doc(path: string): any {
    return firestore().doc(path);
  }

  async setDocument(path: string, data: any, options?: any): Promise<void> {
    const docRef = this.doc(path);
    await docRef.set(data, options || {});
  }

  async getDocument(path: string): Promise<any> {
    const docRef = this.doc(path);
    const docSnap = await docRef.get();
    
    // Compatibilidade com iOS - exists é uma função
    const docExists = typeof docSnap.exists === 'function' ? docSnap.exists() : docSnap.exists;
    
    return {
      exists: docExists,
      data: docExists ? docSnap.data() : null,
      id: docSnap.id
    };
  }

  async updateDocument(path: string, data: any): Promise<void> {
    const docRef = this.doc(path);
    await docRef.update(data);
  }

  async deleteDocument(path: string): Promise<void> {
    const docRef = this.doc(path);
    await docRef.delete();
  }

  async getCollection(path: string): Promise<any[]> {
    const collRef = this.collection(path);
    const snapshot = await collRef.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  onSnapshot(path: string, callback: (data: any) => void): () => void {
    const docRef = this.doc(path);
    return docRef.onSnapshot((doc: any) => {
      callback({
        exists: doc.exists,
        data: doc.data(),
        id: doc.id
      });
    });
  }

  async clearCache(): Promise<void> {
    try {
      // No React Native Firebase v22+, o cache é gerenciado automaticamente
      console.log('🧹 [iOS] Cache gerenciado automaticamente pelo Firebase v22+');
    } catch (error) {
      console.error('❌ [iOS] Erro ao limpar cache:', error);
    }
  }

  /**
   * Optimized range query using document ID for date-based filtering
   * Uses Firestore's orderBy(documentId) + startAt/endAt for efficient querying
   * @param collectionPath Full path to the collection (e.g., users/key/daily_logs)
   * @param startDocId Start document ID in YYYY-MM-DD format
   * @param endDocId End document ID in YYYY-MM-DD format
   * @returns Promise<Array<{id: string, data: any}>> Array of matching documents
   */
  async queryCollectionByDocumentId(collectionPath: string, startDocId: string, endDocId: string): Promise<Array<{id: string, data: any}>> {
    try {
      console.log(`🚀 [iOS] Range query on ${collectionPath}: ${startDocId} to ${endDocId}`);

      // Use Firestore range query with document ID
      const querySnapshot = await firestore()
        .collection(collectionPath)
        .orderBy(firestore.FieldPath.documentId())
        .startAt(startDocId)
        .endAt(endDocId + '\uf8ff') // Unicode high character to include endDocId
        .get();

      const results = querySnapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      console.log(`✅ [iOS] Range query found ${results.length} documents`);
      return results;

    } catch (error) {
      console.error(`❌ [iOS] Error in range query on ${collectionPath}:`, error);
      throw error;
    }
  }
}

export default FirebaseServiceIOS;