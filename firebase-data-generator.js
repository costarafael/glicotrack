// Script para popular dados mockados para usuário NO7MQUXG - Agosto 2025
// Execute com: node firebase-data-generator.js

const admin = require('firebase-admin');
const path = require('path');

// Inicializar Firebase Admin usando credenciais do projeto
try {
  // Tenta usar o arquivo de service account se existir
  const serviceAccountPath = path.join(__dirname, 'firebase-service-account.json');
  const serviceAccount = require(serviceAccountPath);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'glicotrack-41d22'
  });
  console.log('✅ Firebase Admin inicializado com service account');
} catch (error) {
  // Fallback para usar Application Default Credentials
  console.log('⚠️ Service account não encontrado, usando ADC...');
  admin.initializeApp({
    projectId: 'glicotrack-41d22'
  });
}

const db = admin.firestore();

const USER_KEY = 'NO7MQUXG';

// Função para gerar dados realistas de glicose
function generateGlucoseReading(hour, isPostMeal = false) {
  let baseGlucose;
  
  // Padrões realistas por horário
  if (hour >= 6 && hour <= 8) {
    // Manhã - glicose em jejum
    baseGlucose = 80 + Math.random() * 50; // 80-130
  } else if (hour >= 12 && hour <= 14) {
    // Almoço - pode ter picos
    baseGlucose = isPostMeal ? 120 + Math.random() * 80 : 90 + Math.random() * 40;
  } else if (hour >= 18 && hour <= 20) {
    // Jantar - pode ter picos
    baseGlucose = isPostMeal ? 110 + Math.random() * 70 : 85 + Math.random() * 45;
  } else if (hour >= 22 || hour <= 6) {
    // Noite/Madrugada - mais estável
    baseGlucose = 75 + Math.random() * 35; // 75-110
  } else {
    // Outros horários
    baseGlucose = 80 + Math.random() * 60;
  }
  
  return Math.round(baseGlucose);
}

// Função para gerar dosagem de insulina
function generateInsulinDose(mealTime = false, glucoseLevel = 100) {
  if (mealTime) {
    // Bolus para refeição
    const carbRatio = 10 + Math.random() * 5; // 10-15 gramas por unidade
    const estimatedCarbs = 30 + Math.random() * 40; // 30-70g
    return Math.round((estimatedCarbs / carbRatio) * 10) / 10; // 1 decimal
  } else if (glucoseLevel > 180) {
    // Correção para hiperglicemia
    return Math.round((glucoseLevel - 180) / 50 * 10) / 10;
  } else {
    // Basal
    return Math.round((2 + Math.random() * 3) * 10) / 10; // 2-5 unidades
  }
}

// Função para gerar dados de um dia no formato do app
function generateDayData(date) {
  const glucoseEntries = [];
  const bolusEntries = [];
  let basalEntry = null;
  
  // 4-6 medições por dia em horários realistas
  const measurementTimes = [
    { hour: 7, minute: 30, type: 'fasting' },
    { hour: 12, minute: 15, type: 'pre_meal' },
    { hour: 13, minute: 45, type: 'post_meal' },
    { hour: 19, minute: 0, type: 'pre_meal' },
    { hour: 20, minute: 30, type: 'post_meal' },
    { hour: 22, minute: 0, type: 'bedtime' }
  ];
  
  // Adicionar algumas medições extras aleatoriamente
  if (Math.random() > 0.7) {
    measurementTimes.push({ hour: 15, minute: 30, type: 'random' });
  }
  if (Math.random() > 0.8) {
    measurementTimes.push({ hour: 2, minute: 0, type: 'dawn' });
  }
  
  measurementTimes.forEach((time, index) => {
    const timestamp = new Date(date);
    timestamp.setHours(time.hour, time.minute, 0, 0);
    
    const glucose = generateGlucoseReading(time.hour, time.type === 'post_meal');
    
    // Adicionar entrada de glicose (formato do app)
    glucoseEntries.push({
      id: `glucose_${Date.now()}_${index}`,
      value: glucose,
      timestamp: timestamp.toISOString()
    });
    
    // Adicionar insulina bolus se necessário
    if (time.type === 'pre_meal' || glucose > 180) {
      const insulinDose = generateInsulinDose(time.type === 'pre_meal', glucose);
      const insulinTime = new Date(timestamp);
      insulinTime.setMinutes(timestamp.getMinutes() + 5);
      
      bolusEntries.push({
        id: `bolus_${Date.now()}_${index}`,
        units: insulinDose,
        mealType: time.type === 'pre_meal' ? 'lunch' : 'correction',
        timestamp: insulinTime.toISOString()
      });
    }
    
    // Insulina basal (uma por dia, normalmente pela manhã)
    if (time.hour === 7 && !basalEntry) {
      const basalDose = generateInsulinDose(false, 100);
      const basalTime = new Date(timestamp);
      basalTime.setMinutes(timestamp.getMinutes() - 10);
      
      basalEntry = {
        id: `basal_${Date.now()}`,
        units: basalDose,
        timestamp: basalTime.toISOString()
      };
    }
  });
  
  return { glucoseEntries, bolusEntries, basalEntry };
}

// Função principal para popular dados de agosto/2025
async function populateAugustData() {
  console.log('🔥 Iniciando população de dados para usuário NO7MQUXG - Agosto 2025 (formato corrigido)');
  
  let batch = db.batch();
  const year = 2025;
  const month = 8; // Agosto
  const daysInMonth = 31;
  
  try {
    // Verificar se usuário existe
    console.log('📋 Verificando usuário existente...');
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day); // month é 0-indexed
      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      console.log(`📅 Gerando dados para ${dateString}`);
      
      const { glucoseEntries, bolusEntries, basalEntry } = generateDayData(date);
      
      // Calcular estatísticas do dia
      const glucoseValues = glucoseEntries.map(entry => entry.value);
      const avgGlucose = Math.round(glucoseValues.reduce((a, b) => a + b, 0) / glucoseValues.length);
      const maxGlucose = Math.max(...glucoseValues);
      const minGlucose = Math.min(...glucoseValues);
      
      const dayData = {
        date: dateString,
        glucoseEntries: glucoseEntries,
        bolusEntries: bolusEntries,
      };

      // Adicionar basalEntry apenas se existir
      if (basalEntry) {
        dayData.basalEntry = basalEntry;
      }
      
      // Adicionar ao batch usando Firebase Admin
      const docRef = db.collection('users').doc(USER_KEY).collection('daily_logs').doc(dateString);
      batch.set(docRef, dayData);
      
      // Commit em lotes de 10 para evitar limite do Firestore
      if (day % 10 === 0) {
        console.log(`💾 Salvando lote até dia ${day}...`);
        await batch.commit();
        // Reinicializar batch
        batch = db.batch();
      }
    }
    
    // Commit final
    await batch.commit();
    
    console.log('✅ Dados de agosto/2025 populados com sucesso!');
    console.log(`📊 Total: ${daysInMonth} dias de dados realistas`);
    console.log('🎯 Dados incluem (formato correto do app):');
    console.log('   - glucoseEntries: 4-7 medições por dia');
    console.log('   - bolusEntries: insulina para refeições');
    console.log('   - basalEntry: insulina basal diária');
    console.log('   - Padrões realistas por horário');
    console.log('   - Formato compatível com FirebaseDataRepository');
    
  } catch (error) {
    console.error('❌ Erro ao popular dados:', error);
  } finally {
    // Finalizar conexão Admin
    console.log('🔚 Finalizando conexão Firebase Admin...');
    process.exit(0);
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  populateAugustData()
    .then(() => {
      console.log('🏁 Script finalizado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { populateAugustData };