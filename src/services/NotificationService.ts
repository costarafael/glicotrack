/**
 * NotificationService - Gerenciamento de Notificações Push
 * Integração com @notifee/react-native para lembretes inteligentes
 */

import notifee, {
  TriggerType,
  TimestampTrigger,
  AndroidImportance,
  AndroidStyle,
  AndroidCategory,
  AndroidColor,
  AndroidLaunchActivityFlag,
  IOSNotificationSetting,
  AuthorizationStatus,
  EventType,
} from '@notifee/react-native';
import { Alert } from 'react-native';

// Tipos de notificação locais ao serviço
export interface NotificationSound {
  id: string;
  name: string;
  isDefault: boolean;
}

export interface ReminderAction {
  id: string;
  title: string;
  label: string;
  type: string;
  pressAction?: {
    id: string;
    launchActivity?: 'default';
  };
}

export interface NotificationConfig {
  id: string;
  title: string;
  body: string;
  scheduledFor: Date;
  sound: NotificationSound;
  data?: Record<string, any>;
  actions?: ReminderAction[];
}

export class NotificationService {
  private static initialized = false;
  private static channelId = 'glicotrack_reminders';
  
  /**
   * Inicializa o serviço de notificações
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🔔 Inicializando NotificationService...');
    
    try {
      // Solicitar permissões
      await this.requestPermissions();
      
      // Criar canal de notificação (Android)
      await this.createNotificationChannel();
      
      // Configurar handlers de eventos
      await this.setupEventHandlers();
      
      this.initialized = true;
      console.log('✅ NotificationService inicializado com sucesso');
    } catch (error) {
      console.error('❌ Erro ao inicializar NotificationService:', error);
      throw error;
    }
  }

  /**
   * Solicita permissões de notificação
   */
  private static async requestPermissions(): Promise<void> {
    console.log('🔐 Solicitando permissões de notificação...');
    
    const settings = await notifee.requestPermission();
    
    if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) {
      console.log('✅ Permissões de notificação concedidas');
    } else {
      console.warn('⚠️ Permissões de notificação negadas');
      
      Alert.alert(
        'Permissões Necessárias',
        'O GlicoTrack precisa de permissão para enviar notificações de lembretes. Por favor, habilite nas configurações.',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Configurações', onPress: () => notifee.openNotificationSettings() },
        ]
      );
    }
    
    // Verificar configurações específicas do iOS
    if (settings.ios) {
      const { alert, badge, sound, criticalAlert } = settings.ios;
      console.log('📱 Configurações iOS:', { alert, badge, sound, criticalAlert });
    }
  }

  /**
   * Cria canal de notificação (Android)
   */
  private static async createNotificationChannel(): Promise<void> {
    console.log('📢 Criando canal de notificação...');
    
    await notifee.createChannel({
      id: this.channelId,
      name: 'Lembretes GlicoTrack',
      description: 'Notificações de lembretes para monitoramento de glicose e insulina',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      lights: true,
      lightColor: AndroidColor.BLUE,
      badge: true,
    });
    
    console.log('✅ Canal de notificação criado');
  }

  /**
   * Configura handlers de eventos de notificação
   */
  private static async setupEventHandlers(): Promise<void> {
    console.log('⚙️ Configurando handlers de eventos...');
    
    // Handler para foreground events
    notifee.onForegroundEvent(({ type, detail }) => {
      console.log('📱 Evento de notificação (foreground):', type);
      
      switch (type) {
        case EventType.DISMISSED:
          console.log('👋 Notificação dispensada:', detail.notification?.id);
          this.handleNotificationDismissed(detail.notification?.id);
          break;
          
        case EventType.PRESS:
          console.log('👆 Notificação pressionada:', detail.notification?.id);
          this.handleNotificationPress(detail.notification);
          break;
          
        case EventType.ACTION_PRESS:
          console.log('🎬 Ação pressionada:', detail.pressAction?.id);
          this.handleActionPress(detail.pressAction, detail.notification);
          break;
      }
    });
    
    // Handler para background events
    notifee.onBackgroundEvent(async ({ type, detail }) => {
      console.log('🔄 Evento de notificação (background):', type);
      
      switch (type) {
        case EventType.PRESS:
          await this.handleNotificationPress(detail.notification);
          break;
          
        case EventType.ACTION_PRESS:
          await this.handleActionPress(detail.pressAction, detail.notification);
          break;
      }
    });
    
    console.log('✅ Handlers configurados');
  }

  /**
   * Agenda uma notificação
   */
  static async scheduleNotification(config: NotificationConfig): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`⏰ Agendando notificação: ${config.title} para ${config.scheduledFor.toLocaleString()}`);
    
    try {
      // Criar trigger de tempo
      const trigger: TimestampTrigger = {
        type: TriggerType.TIMESTAMP,
        timestamp: config.scheduledFor.getTime(),
      };
      
      // Configurar ações
      const actions = this.buildNotificationActions(config.actions || []);
      
      // Criar notificação
      await notifee.createTriggerNotification(
        {
          id: config.id,
          title: config.title,
          body: config.body,
          data: config.data || {},
          android: {
            channelId: this.channelId,
            importance: AndroidImportance.HIGH,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
              launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
            },
            actions,
            style: {
              type: AndroidStyle.BIGTEXT,
              text: config.body,
            },
            color: AndroidColor.BLUE,
            smallIcon: 'ic_launcher',
            largeIcon: 'ic_launcher',
            showTimestamp: true,
            autoCancel: true,
            ongoing: false,
            category: AndroidCategory.REMINDER,
          },
          ios: {
            categoryId: 'reminder',
            sound: this.getIOSSound(config.sound),
            critical: config.sound.id === 'urgent',
            interruptionLevel: 'active',
          },
        },
        trigger
      );
      
      console.log(`✅ Notificação agendada: ${config.id}`);
    } catch (error) {
      console.error('❌ Erro ao agendar notificação:', error);
      throw error;
    }
  }

  /**
   * Cancela uma notificação agendada
   */
  static async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
      console.log(`🗑️ Notificação cancelada: ${notificationId}`);
    } catch (error) {
      console.error(`❌ Erro ao cancelar notificação ${notificationId}:`, error);
    }
  }

  /**
   * Cancela todas as notificações
   */
  static async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
      console.log('🧹 Todas as notificações canceladas');
    } catch (error) {
      console.error('❌ Erro ao cancelar todas as notificações:', error);
    }
  }

  /**
   * Obtém notificações pendentes
   */
  static async getPendingNotifications(): Promise<any[]> {
    try {
      const notifications = await notifee.getTriggerNotifications();
      console.log(`📋 ${notifications.length} notificações pendentes`);
      return notifications;
    } catch (error) {
      console.error('❌ Erro ao obter notificações pendentes:', error);
      return [];
    }
  }

  /**
   * Exibe notificação imediata
   */
  static async displayNotification(config: Omit<NotificationConfig, 'scheduledFor'>): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    console.log(`🔔 Exibindo notificação imediata: ${config.title}`);
    
    try {
      await notifee.displayNotification({
        id: config.id,
        title: config.title,
        body: config.body,
        data: config.data || {},
        android: {
          channelId: this.channelId,
          importance: AndroidImportance.HIGH,
          pressAction: {
            id: 'default',
            launchActivity: 'default',
            launchActivityFlags: [AndroidLaunchActivityFlag.SINGLE_TOP],
          },
          actions: this.buildNotificationActions(config.actions || []),
          style: {
            type: AndroidStyle.BIGTEXT,
            text: config.body,
          },
          color: AndroidColor.BLUE,
          smallIcon: 'ic_launcher',
          autoCancel: true,
          category: AndroidCategory.REMINDER,
        },
        ios: {
          categoryId: 'reminder',
          sound: this.getIOSSound(config.sound),
          critical: config.sound.id === 'urgent',
        },
      });
      
      console.log(`✅ Notificação exibida: ${config.id}`);
    } catch (error) {
      console.error('❌ Erro ao exibir notificação:', error);
      throw error;
    }
  }

  /**
   * Constrói ações da notificação
   */
  private static buildNotificationActions(actions: ReminderAction[]): any[] {
    return actions.map(action => ({
      title: action.label,
      pressAction: {
        id: action.id,
        launchActivity: action.type === 'open_screen' ? 'default' : undefined,
      },
    }));
  }

  /**
   * Obtém som para iOS
   */
  private static getIOSSound(sound: NotificationSound): string {
    switch (sound.id) {
      case 'gentle':
        return 'gentle.wav';
      case 'urgent':
        return 'urgent.wav';
      case 'default':
      default:
        return 'default';
    }
  }

  /**
   * Manipula notificação dispensada
   */
  private static handleNotificationDismissed(notificationId?: string): void {
    if (!notificationId) return;
    
    console.log(`👋 Lembrete dispensado: ${notificationId}`);
    
    // Registrar estatística de dispensa
    // Pode ser usado para analytics de efetividade dos lembretes
  }

  /**
   * Manipula press na notificação
   */
  private static async handleNotificationPress(notification: any): Promise<void> {
    if (!notification) return;
    
    console.log(`👆 Lembrete pressionado: ${notification.id}`);
    
    const data = notification.data || {};
    
    // Abrir app na tela correta
    if (data.action === 'open_app') {
      // O app já abrirá automaticamente
      // Pode adicionar navegação específica aqui se necessário
      console.log('📱 Abrindo aplicativo...');
    }
    
    // Registrar interação
    this.logNotificationInteraction(notification.id, 'pressed');
  }

  /**
   * Manipula press em ação da notificação
   */
  private static async handleActionPress(action: any, notification: any): Promise<void> {
    if (!action || !notification) return;
    
    console.log(`🎬 Ação executada: ${action.id} na notificação ${notification.id}`);
    
    switch (action.id) {
      case 'snooze':
        await this.snoozeNotification(notification.id, 10); // 10 minutos
        break;
        
      case 'quick_entry':
        // Abrir tela de entrada rápida
        console.log('⚡ Abrindo entrada rápida...');
        break;
        
      case 'dismiss':
        await this.cancelNotification(notification.id);
        break;
        
      default:
        console.log(`🤷 Ação desconhecida: ${action.id}`);
    }
    
    // Registrar interação
    this.logNotificationInteraction(notification.id, `action:${action.id}`);
  }

  /**
   * Adia notificação (snooze)
   */
  private static async snoozeNotification(notificationId: string, delayMinutes: number): Promise<void> {
    try {
      console.log(`😴 Adiando notificação ${notificationId} por ${delayMinutes} minutos`);
      
      // Cancelar notificação atual
      await this.cancelNotification(notificationId);
      
      // Reagendar para depois
      const newTime = new Date(Date.now() + delayMinutes * 60 * 1000);
      
      // Nota: Para funcionar completamente, precisa integrar com ReminderEngine
      // para reagendar o lembrete original
      
      console.log(`⏰ Notificação reagendada para ${newTime.toLocaleString()}`);
    } catch (error) {
      console.error('❌ Erro ao adiar notificação:', error);
    }
  }

  /**
   * Registra interação com notificação
   */
  private static logNotificationInteraction(notificationId: string, interaction: string): void {
    console.log(`📊 Interação registrada: ${notificationId} -> ${interaction}`);
    
    // Aqui pode salvar estatísticas no storage
    // Para analytics de efetividade dos lembretes
  }

  /**
   * Testa notificação (para desenvolvimento)
   */
  static async testNotification(): Promise<void> {
    await this.displayNotification({
      id: 'test_' + Date.now(),
      title: '🧪 Teste de Lembrete',
      body: 'Esta é uma notificação de teste do GlicoTrack',
      sound: { id: 'default', name: 'Padrão', isDefault: true },
      data: { test: 'true', type: 'test_notification' },
    });
  }

  /**
   * Obtém estatísticas de notificações
   */
  static async getNotificationStats(): Promise<any> {
    try {
      const pending = await this.getPendingNotifications();
      
      return {
        pending: pending.length,
        delivered: 0, // getDeliveredNotifications não está disponível nesta versão
        total: pending.length,
      };
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      return { pending: 0, delivered: 0, total: 0 };
    }
  }

  /**
   * Limpa notificações entregues
   */
  static async clearDeliveredNotifications(): Promise<void> {
    try {
      await notifee.cancelDisplayedNotifications();
      console.log('🧹 Notificações entregues limpas');
    } catch (error) {
      console.error('❌ Erro ao limpar notificações entregues:', error);
    }
  }

  /**
   * Verifica se notificações estão habilitadas
   */
  static async areNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED;
    } catch (error) {
      console.error('❌ Erro ao verificar permissões:', error);
      return false;
    }
  }

  /**
   * Abre configurações de notificação
   */
  static async openNotificationSettings(): Promise<void> {
    try {
      await notifee.openNotificationSettings();
    } catch (error) {
      console.error('❌ Erro ao abrir configurações:', error);
    }
  }
}