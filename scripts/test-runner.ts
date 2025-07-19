#!/usr/bin/env ts-node

/**
 * Comprehensive test runner for Vegapunk Agentic System
 * Runs different test suites with proper reporting and validation
 */

import { execSync } from 'child_process';
import { existsSync, writeFileSync } from 'fs';
import { join } from 'path';

interface TestSuite {
  name: string;
  command: string;
  timeout: number;
  critical: boolean;
  description: string;
}

interface TestResult {
  suite: string;
  success: boolean;
  duration: number;
  output: string;
  error?: string;
  coverage?: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

class TestRunner {
  private results: TestResult[] = [];
  
  private testSuites: TestSuite[] = [
    {
      name: 'Unit Tests',
      command: 'npm run test:unit',
      timeout: 60000, // 1 minute
      critical: true,
      description: 'Core component unit tests'
    },
    {
      name: 'Integration Tests', 
      command: 'npm run test:integration',
      timeout: 180000, // 3 minutes
      critical: true,
      description: 'Component integration tests'
    },
    {
      name: 'E2E Tests',
      command: 'npm run test:e2e',
      timeout: 300000, // 5 minutes
      critical: false,
      description: 'End-to-end autonomous behavior tests'
    },
    {
      name: 'Performance Tests',
      command: 'npm run test:performance',
      timeout: 600000, // 10 minutes
      critical: false,
      description: 'Load and performance validation'
    },
    {
      name: 'Type Check',
      command: 'npm run type-check',
      timeout: 30000, // 30 seconds
      critical: true,
      description: 'TypeScript type validation'
    },
    {
      name: 'Lint Check',
      command: 'npm run lint',
      timeout: 30000, // 30 seconds
      critical: true,
      description: 'Code style and quality validation'
    }
  ];

  async runAllTests(options: {
    skipNonCritical?: boolean;
    verbose?: boolean;
    generateReport?: boolean;
  } = {}): Promise<boolean> {
    console.log('🚀 Starting Vegapunk Agentic Test Suite\n');
    
    const suitesToRun = options.skipNonCritical 
      ? this.testSuites.filter(suite => suite.critical)
      : this.testSuites;

    let allPassed = true;

    for (const suite of suitesToRun) {
      console.log(`📋 Running ${suite.name}...`);
      console.log(`   ${suite.description}`);
      
      const result = await this.runTestSuite(suite, options.verbose);
      this.results.push(result);
      
      if (result.success) {
        console.log(`✅ ${suite.name} passed (${result.duration}ms)\n`);
      } else {
        console.log(`❌ ${suite.name} failed (${result.duration}ms)`);
        if (result.error && options.verbose) {
          console.log(`   Error: ${result.error}\n`);
        }
        
        if (suite.critical) {
          allPassed = false;
        }
      }
    }

    // Generate summary report
    this.printSummary();
    
    if (options.generateReport) {
      this.generateHtmlReport();
    }

    return allPassed;
  }

  private async runTestSuite(suite: TestSuite, verbose = false): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      const output = execSync(suite.command, {
        timeout: suite.timeout,
        encoding: 'utf8',
        stdio: verbose ? 'inherit' : 'pipe'
      });

      const duration = Date.now() - startTime;
      
      // Extract coverage if available
      const coverage = this.extractCoverage(output);

      // @ts-ignore
      return {
        suite: suite.name,
        success: true,
        duration,
        output,
        coverage
      };

    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      return {
        suite: suite.name,
        success: false,
        duration,
        output: error.stdout || '',
        error: error.message || error.stderr || 'Unknown error'
      };
    }
  }

  private extractCoverage(output: string): TestResult['coverage'] | undefined {
    // Try to extract Jest coverage from output
    const coverageMatch = output.match(/Lines\s+:\s+([\d.]+)%.*Functions\s+:\s+([\d.]+)%.*Branches\s+:\s+([\d.]+)%.*Statements\s+:\s+([\d.]+)%/s);
    
    if (coverageMatch) {
      return {
        lines: parseFloat(coverageMatch[1]!),
        functions: parseFloat(coverageMatch[2]!),
        branches: parseFloat(coverageMatch[3]!),
        statements: parseFloat(coverageMatch[4]!)
      };
    }
    
    return undefined;
  }

  private printSummary(): void {
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Test Suites: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    // Coverage summary
    const coverageResults = this.results.filter(r => r.coverage);
    if (coverageResults.length > 0) {
      const avgCoverage = {
        lines: coverageResults.reduce((sum, r) => sum + (r.coverage?.lines || 0), 0) / coverageResults.length,
        functions: coverageResults.reduce((sum, r) => sum + (r.coverage?.functions || 0), 0) / coverageResults.length,
        branches: coverageResults.reduce((sum, r) => sum + (r.coverage?.branches || 0), 0) / coverageResults.length,
        statements: coverageResults.reduce((sum, r) => sum + (r.coverage?.statements || 0), 0) / coverageResults.length,
      };

      console.log('\n📈 COVERAGE SUMMARY');
      console.log(`Lines: ${avgCoverage.lines.toFixed(1)}%`);
      console.log(`Functions: ${avgCoverage.functions.toFixed(1)}%`);
      console.log(`Branches: ${avgCoverage.branches.toFixed(1)}%`);
      console.log(`Statements: ${avgCoverage.statements.toFixed(1)}%`);
    }

    // Failed tests details
    const failedResults = this.results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.log('\n❌ FAILED TESTS');
      failedResults.forEach(result => {
        console.log(`- ${result.suite}: ${result.error}`);
      });
    }

    console.log('\n');
  }

  private generateHtmlReport(): void {
    const reportPath = join(process.cwd(), 'test-report.html');
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Vegapunk Agentic Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2196F3; color: white; padding: 20px; border-radius: 5px; }
        .summary { margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 5px; }
        .test-suite { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .passed { border-left: 5px solid #4CAF50; }
        .failed { border-left: 5px solid #f44336; }
        .coverage { display: inline-block; margin: 5px; padding: 5px 10px; background: #e3f2fd; border-radius: 3px; }
        pre { background: #f9f9f9; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚀 Vegapunk Agentic Test Report</h1>
        <p>Generated on ${new Date().toISOString()}</p>
    </div>

    <div class="summary">
        <h2>📊 Summary</h2>
        <p><strong>Total Suites:</strong> ${this.results.length}</p>
        <p><strong>Passed:</strong> ${this.results.filter(r => r.success).length}</p>
        <p><strong>Failed:</strong> ${this.results.filter(r => !r.success).length}</p>
        <p><strong>Total Duration:</strong> ${(this.results.reduce((sum, r) => sum + r.duration, 0) / 1000).toFixed(2)}s</p>
    </div>

    <div class="test-results">
        <h2>📋 Test Results</h2>
        ${this.results.map(result => `
            <div class="test-suite ${result.success ? 'passed' : 'failed'}">
                <h3>${result.success ? '✅' : '❌'} ${result.suite}</h3>
                <p><strong>Duration:</strong> ${result.duration}ms</p>
                ${result.coverage ? `
                    <div>
                        <span class="coverage">Lines: ${result.coverage.lines.toFixed(1)}%</span>
                        <span class="coverage">Functions: ${result.coverage.functions.toFixed(1)}%</span>
                        <span class="coverage">Branches: ${result.coverage.branches.toFixed(1)}%</span>
                        <span class="coverage">Statements: ${result.coverage.statements.toFixed(1)}%</span>
                    </div>
                ` : ''}
                ${result.error ? `<p><strong>Error:</strong> ${result.error}</p>` : ''}
                ${result.output && result.output.length < 2000 ? `<pre>${result.output}</pre>` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;

    writeFileSync(reportPath, html);
    console.log(`📄 HTML report generated: ${reportPath}`);
  }

  async runQuickValidation(): Promise<boolean> {
    console.log('⚡ Running quick validation...\n');
    
    const quickSuites = this.testSuites.filter(suite => 
      suite.critical && suite.timeout <= 60000
    );

    let allPassed = true;

    for (const suite of quickSuites) {
      const result = await this.runTestSuite(suite);
      
      if (result.success) {
        console.log(`✅ ${suite.name} - OK`);
      } else {
        console.log(`❌ ${suite.name} - FAILED`);
        allPassed = false;
      }
    }

    console.log(allPassed ? '\n🎉 Quick validation passed!' : '\n💥 Quick validation failed!');
    return allPassed;
  }

  async runSystemHealthCheck(): Promise<{
    healthy: boolean;
    checks: Array<{ name: string; status: boolean; message: string }>;
  }> {
    console.log('🏥 Running system health check...\n');
    
    const checks = [
      await this.checkNodeVersion(),
      await this.checkDependencies(),
      await this.checkTypeScript(),
      await this.checkEnvironment(),
      await this.checkMemory(),
    ];

    const healthy = checks.every(check => check.status);
    
    checks.forEach(check => {
      console.log(`${check.status ? '✅' : '❌'} ${check.name}: ${check.message}`);
    });

    console.log(healthy ? '\n💚 System is healthy!' : '\n💔 System has issues!');
    
    return { healthy, checks };
  }

  private async checkNodeVersion(): Promise<{ name: string; status: boolean; message: string }> {
    try {
      const version = process.version;
      const majorVersion = parseInt(version.substring(1).split('.')[0]!);
      const status = majorVersion >= 18;
      
      return {
        name: 'Node.js Version',
        status,
        message: `${version} ${status ? '(supported)' : '(requires >= 18.x)'}`
      };
    } catch {
      return { name: 'Node.js Version', status: false, message: 'Unable to check version' };
    }
  }

  private async checkDependencies(): Promise<{ name: string; status: boolean; message: string }> {
    try {
      const nodeModulesExists = existsSync(join(process.cwd(), 'node_modules'));
      const packageLockExists = existsSync(join(process.cwd(), 'package-lock.json'));
      
      return {
        name: 'Dependencies',
        status: nodeModulesExists,
        message: nodeModulesExists 
          ? `Installed ${packageLockExists ? '(with lock file)' : '(no lock file)'}` 
          : 'Not installed - run npm install'
      };
    } catch {
      return { name: 'Dependencies', status: false, message: 'Unable to check dependencies' };
    }
  }

  private async checkTypeScript(): Promise<{ name: string; status: boolean; message: string }> {
    try {
      execSync('npx tsc --version', { stdio: 'pipe' });
      
      return {
        name: 'TypeScript',
        status: true,
        message: 'Available and working'
      };
    } catch {
      return { name: 'TypeScript', status: false, message: 'Not available or not working' };
    }
  }

  private async checkEnvironment(): Promise<{ name: string; status: boolean; message: string }> {
    const envFile = existsSync(join(process.cwd(), '.env'));
    const envExample = existsSync(join(process.cwd(), '.env.example'));
    
    return {
      name: 'Environment',
      status: envFile || envExample,
      message: envFile 
        ? 'Environment file found' 
        : envExample 
          ? 'Example found - copy to .env' 
          : 'No environment files found'
    };
  }

  private async checkMemory(): Promise<{ name: string; status: boolean; message: string }> {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const status = heapUsedMB < 500; // Less than 500MB
    
    return {
      name: 'Memory Usage',
      status,
      message: `${heapUsedMB.toFixed(1)}MB heap used ${status ? '(normal)' : '(high)'}`
    };
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Vegapunk Agentic Test Runner

Usage:
  npm run test:all [options]
  
Options:
  --quick              Run only quick validation tests
  --health             Run system health check
  --skip-non-critical  Skip non-critical test suites
  --verbose            Show detailed output
  --generate-report    Generate HTML report
  --help               Show this help
    `);
    process.exit(0);
  }

  if (args.includes('--health')) {
    const health = await runner.runSystemHealthCheck();
    process.exit(health.healthy ? 0 : 1);
  }

  if (args.includes('--quick')) {
    const success = await runner.runQuickValidation();
    process.exit(success ? 0 : 1);
  }

  const options = {
    skipNonCritical: args.includes('--skip-non-critical'),
    verbose: args.includes('--verbose'),
    generateReport: args.includes('--generate-report')
  };

  const success = await runner.runAllTests(options);
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
  });
}

export { TestRunner };