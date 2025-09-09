/**
 * FirebaseServiceInterface - Interface comum para implementações Android e iOS
 */

export interface FirebaseServiceInterface {
  initialize(): Promise<void>;
  getCurrentUser(): any;
  getCurrentUserId(): string | null;
  isAuthenticated(): boolean;
  getFirestoreInstance(): any;
  getAuthInstance(): any;
  signInAnonymously(): Promise<any>;
  signOut(): Promise<void>;
  
  // Métodos de Firestore
  collection(path: string): any;
  doc(path: string): any;
  setDocument(path: string, data: any, options?: any): Promise<void>;
  getDocument(path: string): Promise<any>;
  updateDocument(path: string, data: any): Promise<void>;
  deleteDocument(path: string): Promise<void>;
  getCollection(path: string): Promise<any[]>;
  onSnapshot(path: string, callback: (data: any) => void): () => void;
  clearCache(): Promise<void>;
  
  // Método otimizado para range query usando document ID
  queryCollectionByDocumentId(collectionPath: string, startDocId: string, endDocId: string): Promise<Array<{id: string, data: any}>>;
}