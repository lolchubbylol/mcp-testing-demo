import { TestConfig } from '../types';

export interface RunnerConfig {
  parallel: boolean;
  timeout: number;
  retries: number;
  verbose: boolean;
  collectMetrics: boolean;
  mcpServers: string[];
}

export class ConfigManager {
  private config: RunnerConfig = {
    parallel: false,
    timeout: 30000,
    retries: 0,
    verbose: true,
    collectMetrics: true,
    mcpServers: []
  };

  getConfig(): RunnerConfig {
    return { ...this.config };
  }

  setConfig(updates: Partial<RunnerConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  loadFromFile(path: string): void {
    // In a real implementation, this would load from a config file
    console.log(`Loading config from: ${path}`);
  }

  validateTestConfig(config: TestConfig): void {
    if (!config.name) {
      throw new Error('Test config must have a name');
    }
    
    if (config.timeout && config.timeout < 0) {
      throw new Error('Test timeout must be positive');
    }
    
    if (config.retries && config.retries < 0) {
      throw new Error('Test retries must be non-negative');
    }
  }
}