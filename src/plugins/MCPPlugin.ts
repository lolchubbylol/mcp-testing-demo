import { MCPConnection } from '../types';

export abstract class MCPPlugin {
  abstract name: string;
  protected connection?: MCPConnection;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract executeCommand(command: string, params?: any): Promise<any>;
  
  isConnected(): boolean {
    return this.connection?.connected ?? false;
  }

  getConnectionInfo(): MCPConnection | undefined {
    return this.connection;
  }

  async testConnection(): Promise<boolean> {
    try {
      // Each plugin should implement a simple test command
      await this.executeCommand('ping');
      return true;
    } catch {
      return false;
    }
  }
}