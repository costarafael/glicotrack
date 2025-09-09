/**
 * FirebaseLogger - Sistema de logging detalhado para debugging de sincronização
 */

export class FirebaseLogger {
  private static instance: FirebaseLogger;
  private logHistory: Array<{ timestamp: Date; level: string; operation: string; data: any }> = [];

  private constructor() {}

  static getInstance(): FirebaseLogger {
    if (!FirebaseLogger.instance) {
      FirebaseLogger.instance = new FirebaseLogger();
    }
    return FirebaseLogger.instance;
  }

  private log(level: string, operation: string, data: any): void {
    const timestamp = new Date();
    const logEntry = { timestamp, level, operation, data };
    
    // Adiciona ao histórico (mantém últimos 100 logs)
    this.logHistory.push(logEntry);
    if (this.logHistory.length > 100) {
      this.logHistory.shift();
    }

    // Log no console com emoji e formatação
    const emoji = this.getEmoji(level);
    const timeStr = timestamp.toISOString().substr(11, 12); // HH:MM:SS.mmm
    
    console.log(`${emoji} [${timeStr}] FIREBASE ${operation}:`, data);
  }

  private getEmoji(level: string): string {
    switch (level) {
      case 'SYNC': return '🔄';
      case 'SUCCESS': return '✅';
      case 'ERROR': return '❌';
      case 'WARNING': return '⚠️';
      case 'INFO': return 'ℹ️';
      case 'DEBUG': return '🔍';
      default: return '📝';
    }
  }

  // Métodos públicos para logging
  sync(operation: string, data: any): void {
    this.log('SYNC', operation, data);
  }

  success(operation: string, data: any): void {
    this.log('SUCCESS', operation, data);
  }

  error(operation: string, error: any): void {
    this.log('ERROR', operation, {
      message: error?.message || 'Unknown error',
      stack: error?.stack || 'No stack trace',
      code: error?.code || 'unknown',
      details: error
    });
  }

  warning(operation: string, data: any): void {
    this.log('WARNING', operation, data);
  }

  info(operation: string, data: any): void {
    this.log('INFO', operation, data);
  }

  debug(operation: string, data: any): void {
    this.log('DEBUG', operation, data);
  }

  // Métodos utilitários
  getLogHistory(): Array<{ timestamp: Date; level: string; operation: string; data: any }> {
    return [...this.logHistory];
  }

  clearHistory(): void {
    this.logHistory = [];
    this.info('LOGGER', 'Log history cleared');
  }

  exportLogs(): string {
    return JSON.stringify(this.logHistory, null, 2);
  }

  // Medição de performance
  startTimer(operation: string): () => void {
    const startTime = Date.now();
    this.debug('TIMER_START', { operation, startTime });
    
    return () => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      this.info('TIMER_END', { operation, duration: `${duration}ms` });
      return duration;
    };
  }
}

export default FirebaseLogger;