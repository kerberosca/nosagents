export class Logger {
  private context: string;

  constructor(context: string) {
    this.context = context;
  }

  info(message: string, data?: any): void {
    this.log('INFO', message, data);
  }

  warn(message: string, data?: any): void {
    this.log('WARN', message, data);
  }

  error(message: string, error?: any): void {
    this.log('ERROR', message, error);
  }

  debug(message: string, data?: any): void {
    if (process.env.NODE_ENV === 'development') {
      this.log('DEBUG', message, data);
    }
  }

  private log(level: string, message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      context: this.context,
      message,
      ...(data && { data }),
    };

    // En production, envoyer vers un service de logging
    if (process.env.NODE_ENV === 'production') {
      // TODO: Implémenter l'envoi vers un service de logging
      console.log(JSON.stringify(logEntry));
    } else {
      // En développement, afficher de manière lisible
      const prefix = `[${timestamp}] ${level} ${this.context}`;
      console.log(`${prefix}: ${message}`);
      if (data) {
        console.log(`${prefix} Data:`, data);
      }
    }
  }
}
