import { TestRunner } from '../../src/core/TestRunner';
import { GitHubMCPPlugin } from '../../src/plugins/GitHubMCPPlugin';

describe('GitHub MCP Integration Tests', () => {
  let runner: TestRunner;

  beforeAll(() => {
    runner = new TestRunner();
    runner.registerPlugin(new GitHubMCPPlugin());
  });

  test('should run complete GitHub MCP test suite', async () => {
    const results = await runner.runTests([
      {
        name: 'GitHub Repository Management',
        mcpServers: ['github-mcp'],
        timeout: 30000
      },
      {
        name: 'GitHub Issue Tracking',
        mcpServers: ['github-mcp'],
        timeout: 20000
      },
      {
        name: 'GitHub CI/CD Operations',
        mcpServers: ['github-mcp'],
        timeout: 25000
      }
    ]);

    expect(results).toHaveLength(3);
    results.forEach(result => {
      expect(result.status).toBe('passed');
      expect(result.metrics).toBeDefined();
      expect(result.metrics!.responseTime).toBeLessThan(30000);
    });

    // Log performance summary
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / results.length;
    
    console.log(`\nGitHub MCP Performance Summary:`);
    console.log(`Total tests: ${results.length}`);
    console.log(`Total duration: ${totalDuration}ms`);
    console.log(`Average duration: ${avgDuration.toFixed(2)}ms`);
  });
});