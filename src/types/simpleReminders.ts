/**
 * Sistema de Lembretes Simplificado
 * Estrutura mais simples e intuitiva para os 4 tipos de lembretes
 */

export type ReminderType = 'basal' | 'daily_log' | 'glucose_after_bolus' | 'glucose_fixed';

export interface BaseReminder {
  id: string;
  type: ReminderType;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 1. Lembrete Basal - Horário fixo diário editável
export interface BasalReminder extends BaseReminder {
  type: 'basal';
  time: string; // HH:MM
}

// 2. Lembrete Registro Diário - Horário limite para verificar se houve registro
export interface DailyLogReminder extends BaseReminder {
  type: 'daily_log';
  checkTime: string; // HH:MM - hora para verificar se houve registro no dia
}

// 3. Lembrete Glicose após Bolus - X tempo após último bolus
export interface GlucoseAfterBolusReminder extends BaseReminder {
  type: 'glucose_after_bolus';
  delayHours: number;
  delayMinutes: number;
}

// 4. Lembrete Glicose Fixo - Múltiplos horários fixos no dia
export interface GlucoseFixedReminder extends BaseReminder {
  type: 'glucose_fixed';
  times: string[]; // Array de horários HH:MM
}

export type SimpleReminder = BasalReminder | DailyLogReminder | GlucoseAfterBolusReminder | GlucoseFixedReminder;

// Interface para configuração do sistema
export interface ReminderSystemConfig {
  enabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Interface para notificação
export interface ReminderNotification {
  id: string;
  reminderId: string;
  title: string;
  body: string;
  scheduledFor: Date;
  type: ReminderType;
}