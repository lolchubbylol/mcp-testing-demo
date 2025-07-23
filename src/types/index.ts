/**
 * Core type definitions for MCP Testing Framework
 */

export interface TestConfig {
  name: string;
  timeout?: number;
  retries?: number;
  mcpServers?: string[];
}

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: Error;
  metrics?: TestMetrics;
}

export interface TestMetrics {
  tokenUsage: number;
  responseTime: number;
  memoryUsage: number;
}

export interface MCPConnection {
  serverId: string;
  connected: boolean;
  lastActivity: Date;
}

export type TestLifecycleHook = () => Promise<void> | void;