/**
 * FirebaseServiceAndroid - Implementação usando React Native Firebase (nativo)
 * Atualizado para usar API modular (v22+)
 */

// TEMP: Simplificando imports para resolver problemas
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { FirebaseServiceInterface } from './FirebaseServiceInterface';

export class FirebaseServiceAndroid implements FirebaseServiceInterface {
  private currentUser: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Firebase Android já inicializado');
      return;
    }

    try {
      console.log('🔥 [Android] Inicializando Firebase nativo...');
      
      // TEMP: Usando API legada que funciona
      this.currentUser = auth().currentUser;
      
      if (!this.currentUser) {
        console.log('🔐 [Android] Fazendo login anônimo...');
        const userCredential = await auth().signInAnonymously();
        this.currentUser = userCredential.user;
        console.log('✅ [Android] Login anônimo realizado:', this.currentUser.uid);
      } else {
        console.log('✅ [Android] Usuário já autenticado:', this.currentUser.uid);
      }

      // Configura Firestore para funcionar offline
      console.log('💾 [Android] Configurando Firestore offline...');
      await firestore().settings({
        persistence: true,
        cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
      });
      console.log('✅ [Android] Cache offline configurado');
      
      this.isInitialized = true;
      console.log('🔥 [Android] Firebase nativo inicializado com sucesso!');
      
    } catch (error) {
      console.error('❌ [Android] Erro ao inicializar Firebase:', error);
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

  // Helpers para collections - usando API legada
  collection(path: string): any {
    return firestore().collection(path);
  }

  doc(path: string): any {
    // Usando API legada - firestore().doc() resolve paths automaticamente
    return firestore().doc(path);
  }

  async setDocument(path: string, data: any, options?: any): Promise<void> {
    const docRef = this.doc(path);
    await docRef.set(data, options || {});
  }

  async getDocument(path: string): Promise<any> {
    const docRef = this.doc(path);
    const docSnap = await docRef.get();
    
    // FirebaseServiceAndroid API: exists é uma função, não propriedade
    const docExists = typeof docSnap.exists === 'function' ? docSnap.exists() : docSnap.exists;
    
    return {
      exists: docExists,
      data: docExists ? docSnap.data() : null,
      id: docSnap.id
    };
  }

  // TEMPORÁRIO - CRIAR DADOS DE TESTE PARA DEMO5678
  async createTestDataForDEMO5678(): Promise<void> {
    console.log('🎯 [TEST] Criando dados de teste para DEMO5678...');
    
    const testData = {
      "2025-08-09": {
        date: "2025-08-09",
        glucoseEntries: [
          {
            id: "glucose_1723252800000_1", 
            value: 120,
            timestamp: "2025-08-09T08:00:00.000Z"
          },
          {
            id: "glucose_1723263600000_2",
            value: 180, 
            timestamp: "2025-08-09T11:00:00.000Z"
          }
        ],
        bolusEntries: [
          {
            id: "bolus_1723263900000_1",
            units: 8,
            mealType: "breakfast",
            timestamp: "2025-08-09T11:05:00.000Z"
          }
        ],
        basalEntry: {
          id: "basal_1723320000000",
          units: 22,
          timestamp: "2025-08-09T22:00:00.000Z"
        },
        notes: "Registros de teste - 09 de agosto",
        lastUpdated: "2025-08-09T23:30:00.000Z"
      },
      "2025-08-08": {
        date: "2025-08-08",
        glucoseEntries: [
          {
            id: "glucose_1723161600000_1",
            value: 95,
            timestamp: "2025-08-08T07:30:00.000Z"
          },
          {
            id: "glucose_1723179600000_2", 
            value: 155,
            timestamp: "2025-08-08T12:30:00.000Z"
          },
          {
            id: "glucose_1723201200000_3",
            value: 105,
            timestamp: "2025-08-08T18:30:00.000Z"
          }
        ],
        bolusEntries: [
          {
            id: "bolus_1723180200000_1",
            units: 10,
            mealType: "lunch", 
            timestamp: "2025-08-08T12:40:00.000Z"
          },
          {
            id: "bolus_1723201800000_2",
            units: 6,
            mealType: "dinner",
            timestamp: "2025-08-08T18:40:00.000Z"
          }
        ],
        basalEntry: null,
        notes: "Registros de teste - 08 de agosto",
        lastUpdated: "2025-08-08T20:00:00.000Z"
      },
      "2025-08-07": {
        date: "2025-08-07", 
        glucoseEntries: [
          {
            id: "glucose_1723075200000_1",
            value: 88,
            timestamp: "2025-08-07T07:00:00.000Z"
          }
        ],
        bolusEntries: [
          {
            id: "bolus_1723093200000_1", 
            units: 4,
            mealType: "correction",
            timestamp: "2025-08-07T12:00:00.000Z"
          }
        ],
        basalEntry: {
          id: "basal_1723140000000",
          units: 18,
          timestamp: "2025-08-07T21:00:00.000Z"
        },
        notes: "Registros de teste - 07 de agosto - Poucos dados",
        lastUpdated: "2025-08-07T22:00:00.000Z"
      }
    };

    try {
      for (const [date, data] of Object.entries(testData)) {
        const path = `users/DEMO5678/daily_logs/${date}`;
        console.log(`🎯 [TEST] Criando documento: ${path}`);
        await this.setDocument(path, data);
        console.log(`✅ [TEST] Documento ${date} criado com sucesso`);
      }
      console.log('🎉 [TEST] Todos os dados de teste foram criados!');
    } catch (error) {
      console.error('❌ [TEST] Erro ao criar dados:', error);
    }
  }

  // TEMPORÁRIO - DEBUG FIREBASE ANDROID
  async debugFirebaseAccess(originalPath: string): Promise<any> {
    console.log('🔍 [DEBUG] Testando acesso direto ao Firestore...');
    console.log('🔍 [DEBUG] Original path:', originalPath);
    
    try {
      // Teste 1: Verificar se o Firestore está funcionando
      console.log('📋 [DEBUG] Teste 1: Verificando coleção users...');
      const usersCollection = await firestore().collection('users').get();
      console.log(`✅ [DEBUG] Usuários encontrados: ${usersCollection.size}`);
      
      // EXECUTAR UMA VEZ: Criar dados de teste se não existirem
      const testDoc = await firestore().collection('users').doc('DEMO5678').collection('daily_logs').doc('2025-08-09').get();
      if (!testDoc.exists) {
        console.log('🎯 [DEBUG] Criando dados de teste...');
        await this.createTestDataForDEMO5678();
      }
      
      usersCollection.forEach(doc => {
        console.log(`  - [DEBUG] User: ${doc.id}`);
      });
      
      // Teste 2: Acessar DEMO5678 diretamente 
      console.log('📋 [DEBUG] Teste 2: Acessando daily_logs DEMO5678...');
      const dailyLogsRef = firestore()
        .collection('users')
        .doc('DEMO5678')
        .collection('daily_logs');
        
      const dailyLogsSnapshot = await dailyLogsRef.get();
      console.log(`✅ [DEBUG] Daily logs encontrados: ${dailyLogsSnapshot.size}`);
      
      dailyLogsSnapshot.forEach(doc => {
        const docData = doc.data();
        const keys = docData ? Object.keys(docData).join(', ') : 'no data';
        console.log(`  - [DEBUG] Date: ${doc.id}, keys: ${keys}`);
      });
      
      // Teste 3: Documento específico 2025-08-09
      console.log('📋 [DEBUG] Teste 3: Documento 2025-08-09...');
      const docRef = firestore()
        .collection('users')
        .doc('DEMO5678')
        .collection('daily_logs')
        .doc('2025-08-09');
        
      const docSnapshot = await docRef.get();
      console.log(`✅ [DEBUG] Documento exists: ${docSnapshot.exists}`);
      
      if (docSnapshot.exists) {
        const data = docSnapshot.data();
        console.log('📊 [DEBUG] Estrutura do documento:');
        console.log(`  - glucoseEntries: ${data?.glucoseEntries?.length || 0}`);
        console.log(`  - bolusEntries: ${data?.bolusEntries?.length || 0}`);
        console.log(`  - basalEntry: ${data?.basalEntry ? 'Sim' : 'Não'}`);
        console.log(`  - notes: "${data?.notes || 'sem notas'}"`);
        
        return {
          exists: docSnapshot.exists,
          data: data,
          id: docSnapshot.id
        };
      } else {
        console.log('❌ [DEBUG] Documento não existe!');
        return {
          exists: false,
          data: null,
          id: '2025-08-09'
        };
      }
      
    } catch (error) {
      console.error('❌ [DEBUG] Erro:', error);
      return {
        exists: false,
        data: null,
        id: '2025-08-09',
        error: error?.message || String(error) || 'Unknown error'
      };
    }
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
      // Esta função é mantida para compatibilidade mas não executa limpeza manual
      console.log('🧹 [Android] Cache gerenciado automaticamente pelo Firebase v22+');
    } catch (error) {
      console.error('❌ [Android] Erro ao limpar cache:', error);
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
      console.log(`🚀 [Android] Range query on ${collectionPath}: ${startDocId} to ${endDocId}`);

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

      console.log(`✅ [Android] Range query found ${results.length} documents`);
      return results;

    } catch (error) {
      console.error(`❌ [Android] Error in range query on ${collectionPath}:`, error);
      throw error;
    }
  }
}

export default FirebaseServiceAndroid;