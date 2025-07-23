import { GitHubMCPPlugin } from '../src/plugins/GitHubMCPPlugin';
import { TestRunner } from '../src/core/TestRunner';

describe('GitHub MCP Test Suite', () => {
  let plugin: GitHubMCPPlugin;
  let runner: TestRunner;

  beforeEach(async () => {
    plugin = new GitHubMCPPlugin();
    runner = new TestRunner();
    runner.registerPlugin(plugin);
    await plugin.connect();
  });

  afterEach(async () => {
    await plugin.disconnect();
  });

  describe('Repository Management', () => {
    test('should list repositories', async () => {
      const result = await plugin.executeCommand('list_repos', {
        owner: 'test-user'
      });
      
      expect(result.repositories).toBeDefined();
      expect(result.total).toBeGreaterThan(0);
    });

    test('should handle repository creation', async () => {
      const startTime = Date.now();
      const result = await plugin.executeCommand('create_repo', {
        name: 'test-repo',
        private: false,
        description: 'Test repository'
      });
      const duration = Date.now() - startTime;
      
      console.log(`Repository creation took ${duration}ms`);
      expect(duration).toBeLessThan(5000); // Performance check
    });
  });

  describe('Issue and PR Operations', () => {
    test('should create an issue', async () => {
      const result = await plugin.executeCommand('create_issue', {
        owner: 'test-user',
        repo: 'test-repo',
        title: 'Test Issue',
        body: 'This is a test issue'
      });
      
      expect(result.id).toBeDefined();
      expect(result.state).toBe('open');
    });

    test('should handle PR operations', async () => {
      // Test multiple PR operations
      const operations = [
        'create_pr',
        'update_pr',
        'merge_pr',
        'list_pr_comments'
      ];
      
      const results = [];
      for (const op of operations) {
        const start = Date.now();
        try {
          await plugin.executeCommand(op, { /* params */ });
          results.push({ op, time: Date.now() - start, status: 'success' });
        } catch (error) {
          results.push({ op, time: Date.now() - start, status: 'failed' });
        }
      }
      
      console.log('PR Operations Performance:', results);
    });
  });

  describe('Workflow Management', () => {
    test('should get workflow runs', async () => {
      const result = await plugin.executeCommand('get_workflow_runs', {
        owner: 'test-user',
        repo: 'test-repo',
        workflow_id: 'ci.yml'
      });
      
      expect(result.workflow_runs).toBeDefined();
      expect(Array.isArray(result.workflow_runs)).toBe(true);
    });

    test('should measure API response times', async () => {
      const commands = ['list_repos', 'create_issue', 'get_workflow_runs'];
      const metrics = [];
      
      for (const cmd of commands) {
        const start = Date.now();
        await plugin.executeCommand(cmd, {});
        const duration = Date.now() - start;
        
        metrics.push({ command: cmd, responseTime: duration });
      }
      
      console.log('API Response Metrics:', metrics);
      
      // All commands should respond within 1 second
      metrics.forEach(m => {
        expect(m.responseTime).toBeLessThan(1000);
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle rate limiting gracefully', async () => {
      // Simulate rapid requests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(plugin.executeCommand('list_repos', {}));
      }
      
      try {
        await Promise.all(promises);
      } catch (error: any) {
        // Should handle rate limiting
        expect(error.message).toMatch(/rate limit|too many requests/i);
      }
    });

    test('should handle invalid parameters', async () => {
      await expect(
        plugin.executeCommand('create_issue', { /* missing required params */ })
      ).rejects.toThrow();
    });
  });
});