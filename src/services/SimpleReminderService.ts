/**
 * SimpleReminderService - Serviço simplificado de lembretes
 * Gerencia os 4 tipos de lembretes de forma intuitiva
 */

import { MMKV } from 'react-native-mmkv';
import { 
  SimpleReminder, 
  BasalReminder, 
  DailyLogReminder, 
  GlucoseAfterBolusReminder, 
  GlucoseFixedReminder,
  ReminderSystemConfig,
  ReminderType 
} from '../types/simpleReminders';
import { StorageService } from './storage';
import { NotificationService, NotificationSound } from './NotificationService';

const storage = new MMKV();

export class SimpleReminderService {
  private static instance: SimpleReminderService;
  private static readonly STORAGE_KEY = 'simple_reminders';
  private static readonly CONFIG_KEY = 'reminder_system_config';
  
  private constructor() {}

  static getInstance(): SimpleReminderService {
    if (!SimpleReminderService.instance) {
      SimpleReminderService.instance = new SimpleReminderService();
    }
    return SimpleReminderService.instance;
  }

  /**
   * Inicializa o serviço com lembretes padrão
   */
  async initialize(): Promise<void> {
    console.log('🔔 Inicializando SimpleReminderService...');
    
    let reminders = this.getAllReminders();
    
    // Se não há lembretes, criar os padrão
    if (reminders.length === 0) {
      reminders = this.createDefaultReminders();
      this.saveAllReminders(reminders);
    }
    
    // Reagendar notificações
    await this.rescheduleAllNotifications();
    
    console.log('✅ SimpleReminderService inicializado');
  }

  /**
   * Cria lembretes padrão
   */
  private createDefaultReminders(): SimpleReminder[] {
    const now = new Date();
    
    return [
      // 1. Lembrete Basal
      {
        id: 'basal_reminder',
        type: 'basal',
        name: 'Insulina Basal',
        description: 'Lembrete diário para aplicação da insulina basal',
        enabled: true,
        time: '08:00',
        createdAt: now,
        updatedAt: now,
      } as BasalReminder,

      // 2. Lembrete Registro Diário
      {
        id: 'daily_log_reminder',
        type: 'daily_log',
        name: 'Registro Diário',
        description: 'Verificar se houve algum registro no dia',
        enabled: true,
        checkTime: '21:00',
        createdAt: now,
        updatedAt: now,
      } as DailyLogReminder,

      // 3. Lembrete Glicose após Bolus
      {
        id: 'glucose_after_bolus_reminder',
        type: 'glucose_after_bolus',
        name: 'Glicose após Bolus',
        description: 'Medir glicose após aplicação de insulina bolus',
        enabled: true,
        delayHours: 2,
        delayMinutes: 0,
        createdAt: now,
        updatedAt: now,
      } as GlucoseAfterBolusReminder,

      // 4. Lembrete Glicose Fixo
      {
        id: 'glucose_fixed_reminder',
        type: 'glucose_fixed',
        name: 'Glicose - Horários Fixos',
        description: 'Lembretes de glicose em horários fixos do dia',
        enabled: false, // Desabilitado por padrão
        times: ['07:00', '12:00', '18:00'], // Horários exemplo
        createdAt: now,
        updatedAt: now,
      } as GlucoseFixedReminder,
    ];
  }

  /**
   * Obtém todos os lembretes
   */
  getAllReminders(): SimpleReminder[] {
    const data = storage.getString(SimpleReminderService.STORAGE_KEY);
    if (!data) return [];

    try {
      const reminders = JSON.parse(data);
      return reminders.map((r: any) => ({
        ...r,
        createdAt: new Date(r.createdAt),
        updatedAt: new Date(r.updatedAt),
      }));
    } catch (error) {
      console.error('❌ Erro ao carregar lembretes:', error);
      return [];
    }
  }

  /**
   * Salva todos os lembretes
   */
  private saveAllReminders(reminders: SimpleReminder[]): void {
    storage.set(SimpleReminderService.STORAGE_KEY, JSON.stringify(reminders));
  }

  /**
   * Obtém lembrete por tipo
   */
  getReminderByType(type: ReminderType): SimpleReminder | null {
    const reminders = this.getAllReminders();
    return reminders.find(r => r.type === type) || null;
  }

  /**
   * Atualiza lembrete
   */
  updateReminder(reminderId: string, updates: Partial<SimpleReminder>): boolean {
    const reminders = this.getAllReminders();
    const index = reminders.findIndex(r => r.id === reminderId);
    
    if (index === -1) return false;

    reminders[index] = {
      ...reminders[index],
      ...updates,
      updatedAt: new Date(),
    } as SimpleReminder;

    this.saveAllReminders(reminders);
    
    // Reagendar notificações
    this.rescheduleAllNotifications();
    
    console.log(`✅ Lembrete atualizado: ${reminders[index].name}`);
    return true;
  }

  /**
   * Reagenda todas as notificações
   */
  private async rescheduleAllNotifications(): Promise<void> {
    // Cancelar todas as notificações existentes
    await NotificationService.cancelAllNotifications();
    
    const config = this.getSystemConfig();
    if (!config.enabled) return;

    const reminders = this.getAllReminders().filter(r => r.enabled);
    
    for (const reminder of reminders) {
      await this.scheduleReminderNotifications(reminder);
    }
  }

  /**
   * Agenda notificações para um lembrete específico
   */
  private async scheduleReminderNotifications(reminder: SimpleReminder): Promise<void> {
    switch (reminder.type) {
      case 'basal':
        await this.scheduleBasalReminder(reminder as BasalReminder);
        break;
      case 'daily_log':
        await this.scheduleDailyLogReminder(reminder as DailyLogReminder);
        break;
      case 'glucose_after_bolus':
        // Este tipo é agendado dinamicamente quando um bolus é registrado
        break;
      case 'glucose_fixed':
        await this.scheduleGlucoseFixedReminder(reminder as GlucoseFixedReminder);
        break;
    }
  }

  /**
   * Agenda lembrete basal para os próximos dias
   */
  private async scheduleBasalReminder(reminder: BasalReminder): Promise<void> {
    const [hours, minutes] = reminder.time.split(':').map(Number);
    
    // Agendar para os próximos 7 dias
    for (let i = 0; i < 7; i++) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + i);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      // Só agendar se for no futuro
      if (scheduledDate > new Date()) {
        await NotificationService.scheduleNotification({
          id: `${reminder.id}_${scheduledDate.getTime()}`,
          title: '💉 Hora da Insulina Basal',
          body: 'Não se esqueça de aplicar sua insulina basal',
          scheduledFor: scheduledDate,
          sound: { id: 'default', name: 'Padrão', isDefault: true } as NotificationSound,
          data: {
            reminderId: reminder.id,
            type: 'basal',
            action: 'open_app',
          },
        });
      }
    }
  }

  /**
   * Agenda lembrete de registro diário
   */
  private async scheduleDailyLogReminder(reminder: DailyLogReminder): Promise<void> {
    const [hours, minutes] = reminder.checkTime.split(':').map(Number);
    
    // Agendar para os próximos 7 dias
    for (let i = 0; i < 7; i++) {
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + i);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      // Só agendar se for no futuro
      if (scheduledDate > new Date()) {
        // Verificar se haverá registros no dia antes de disparar
        await NotificationService.scheduleNotification({
          id: `${reminder.id}_${scheduledDate.getTime()}`,
          title: '📋 Registro Diário Pendente',
          body: 'Você ainda não fez nenhum registro hoje. Que tal anotar como foi seu dia?',
          scheduledFor: scheduledDate,
          sound: { id: 'gentle', name: 'Gentil', isDefault: false } as NotificationSound,
          data: {
            reminderId: reminder.id,
            type: 'daily_log',
            action: 'open_app',
            checkDate: scheduledDate.toISOString().split('T')[0],
          },
        });
      }
    }
  }

  /**
   * Agenda lembrete de glicose em horários fixos
   */
  private async scheduleGlucoseFixedReminder(reminder: GlucoseFixedReminder): Promise<void> {
    // Agendar para os próximos 7 dias
    for (let day = 0; day < 7; day++) {
      for (const time of reminder.times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        const scheduledDate = new Date();
        scheduledDate.setDate(scheduledDate.getDate() + day);
        scheduledDate.setHours(hours, minutes, 0, 0);
        
        // Só agendar se for no futuro
        if (scheduledDate > new Date()) {
          await NotificationService.scheduleNotification({
            id: `${reminder.id}_${time}_${scheduledDate.getTime()}`,
            title: '🩸 Hora de Medir a Glicose',
            body: `Lembrete de glicose das ${time}`,
            scheduledFor: scheduledDate,
            sound: { id: 'default', name: 'Padrão', isDefault: true } as NotificationSound,
            data: {
              reminderId: reminder.id,
              type: 'glucose_fixed',
              time: time,
              action: 'open_app',
            },
          });
        }
      }
    }
  }

  /**
   * Agenda lembrete de glicose após bolus (chamado quando um bolus é registrado)
   */
  async scheduleGlucoseAfterBolus(bolusTimestamp: Date): Promise<void> {
    const reminder = this.getReminderByType('glucose_after_bolus') as GlucoseAfterBolusReminder;
    if (!reminder || !reminder.enabled) return;

    const delayMs = (reminder.delayHours * 60 + reminder.delayMinutes) * 60 * 1000;
    const scheduledDate = new Date(bolusTimestamp.getTime() + delayMs);

    // Só agendar se for no futuro
    if (scheduledDate > new Date()) {
      await NotificationService.scheduleNotification({
        id: `glucose_after_bolus_${bolusTimestamp.getTime()}`,
        title: '🩸 Hora de Medir a Glicose',
        body: `Já se passaram ${reminder.delayHours}h${reminder.delayMinutes > 0 ? reminder.delayMinutes + 'm' : ''} desde sua última aplicação de bolus`,
        scheduledFor: scheduledDate,
        sound: { id: 'default', name: 'Padrão', isDefault: true },
        data: {
          reminderId: reminder.id,
          type: 'glucose_after_bolus',
          bolusTime: bolusTimestamp.toISOString(),
          action: 'open_app',
        },
      });
    }
  }

  /**
   * Verifica se deve disparar lembrete de registro diário
   */
  async checkDailyLogReminder(date: string): Promise<boolean> {
    const reminder = this.getReminderByType('daily_log') as DailyLogReminder;
    if (!reminder || !reminder.enabled) return false;

    // Verificar se há registros no dia
    const dailyLog = StorageService.getDailyLog(date);
    const hasRecords = dailyLog && (
      dailyLog.glucoseEntries.length > 0 ||
      dailyLog.bolusEntries.length > 0 ||
      dailyLog.basalEntry ||
      (dailyLog.notes && dailyLog.notes.trim().length > 0)
    );

    return !hasRecords; // Retorna true se NÃO há registros
  }

  /**
   * Obtém configuração do sistema
   */
  getSystemConfig(): ReminderSystemConfig {
    const data = storage.getString(SimpleReminderService.CONFIG_KEY);
    
    if (data) {
      try {
        return JSON.parse(data);
      } catch (error) {
        console.warn('⚠️ Erro ao carregar configuração do sistema');
      }
    }

    // Configuração padrão
    return {
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  /**
   * Salva configuração do sistema
   */
  saveSystemConfig(config: ReminderSystemConfig): void {
    storage.set(SimpleReminderService.CONFIG_KEY, JSON.stringify(config));
    // Reagendar notificações com nova configuração
    this.rescheduleAllNotifications();
  }

  /**
   * Obtém estatísticas dos lembretes
   */
  getStats(): { enabled: number; total: number; nextReminder?: Date } {
    const reminders = this.getAllReminders();
    const enabled = reminders.filter(r => r.enabled).length;
    
    return {
      enabled,
      total: reminders.length,
    };
  }
}