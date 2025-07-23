import { TestConfig, TestResult, TestLifecycleHook, TestMetrics } from '../types';
import { MCPPlugin } from '../plugins/MCPPlugin';
import { ConfigManager } from './ConfigManager';

export class TestRunner {
  private plugins: Map<string, MCPPlugin> = new Map();
  private config: ConfigManager;
  private beforeAllHooks: TestLifecycleHook[] = [];
  private afterAllHooks: TestLifecycleHook[] = [];
  private beforeEachHooks: TestLifecycleHook[] = [];
  private afterEachHooks: TestLifecycleHook[] = [];

  constructor() {
    this.config = new ConfigManager();
  }

  registerPlugin(plugin: MCPPlugin): void {
    this.plugins.set(plugin.name, plugin);
    console.log(`Registered MCP plugin: ${plugin.name}`);
  }

  async runTests(configs: TestConfig[]): Promise<TestResult[]> {
    const results: TestResult[] = [];
    const startTime = Date.now();

    // Run beforeAll hooks
    await this.runHooks(this.beforeAllHooks);

    for (const config of configs) {
      const result = await this.runSingleTest(config);
      results.push(result);
    }

    // Run afterAll hooks
    await this.runHooks(this.afterAllHooks);

    const totalDuration = Date.now() - startTime;
    console.log(`\nAll tests completed in ${totalDuration}ms`);
    
    return results;
  }

  private async runSingleTest(config: TestConfig): Promise<TestResult> {
    const startTime = Date.now();
    const startMemory = process.memoryUsage().heapUsed;
    
    console.log(`\nRunning test: ${config.name}`);

    try {
      // Run beforeEach hooks
      await this.runHooks(this.beforeEachHooks);

      // Initialize MCP connections if specified
      if (config.mcpServers) {
        await this.initializeMCPConnections(config.mcpServers);
      }

      // Run the actual test (placeholder for now)
      await this.executeTest(config);

      // Run afterEach hooks
      await this.runHooks(this.afterEachHooks);

      const duration = Date.now() - startTime;
      const memoryUsed = process.memoryUsage().heapUsed - startMemory;

      return {
        name: config.name,
        status: 'passed',
        duration,
        metrics: {
          tokenUsage: 0, // To be implemented
          responseTime: duration,
          memoryUsage: memoryUsed
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        name: config.name,
        status: 'failed',
        duration,
        error: error as Error
      };
    }
  }

  private async initializeMCPConnections(servers: string[]): Promise<void> {
    for (const server of servers) {
      const plugin = this.plugins.get(server);
      if (plugin) {
        await plugin.connect();
      }
    }
  }

  private async executeTest(config: TestConfig): Promise<void> {
    // Placeholder for actual test execution
    // This would integrate with Jest or other test frameworks
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private async runHooks(hooks: TestLifecycleHook[]): Promise<void> {
    for (const hook of hooks) {
      await hook();
    }
  }

  beforeAll(hook: TestLifecycleHook): void {
    this.beforeAllHooks.push(hook);
  }

  afterAll(hook: TestLifecycleHook): void {
    this.afterAllHooks.push(hook);
  }

  beforeEach(hook: TestLifecycleHook): void {
    this.beforeEachHooks.push(hook);
  }

  afterEach(hook: TestLifecycleHook): void {
    this.afterEachHooks.push(hook);
  }
}