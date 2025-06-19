#!/usr/bin/env node
/**
 * Setup script for Postman collection Git integration
 * Configures Git hooks and sync mechanisms
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PostmanSetup {
  constructor() {
    this.rootDir = path.join(__dirname, '..', '..');
    this.postmanDir = path.join(__dirname, '..');
    this.gitHooksDir = path.join(this.rootDir, '.githooks');
    this.gitDir = path.join(this.rootDir, '.git');
  }

  // Check if we're in a Git repository
  isGitRepo() {
    return fs.existsSync(this.gitDir);
  }

  // Setup Git hooks
  setupGitHooks() {
    console.log('🔧 Setting up Git hooks for Postman validation...');

    if (!this.isGitRepo()) {
      console.log('⚠️  Not in a Git repository, skipping Git hooks setup');
      return false;
    }

    try {
      // Configure Git to use our hooks directory
      execSync(`git config core.hooksPath .githooks`, { cwd: this.rootDir });

      // Make hook executable (for Unix-like systems)
      const preCommitHook = path.join(this.gitHooksDir, 'pre-commit');
      if (fs.existsSync(preCommitHook)) {
        try {
          execSync(`chmod +x "${preCommitHook}"`, { cwd: this.rootDir });
        } catch (error) {
          // chmod might not work on Windows, that's okay
          console.log(
            '📝 Note: Could not set execute permissions (probably Windows)',
          );
        }
      }

      console.log('✅ Git hooks configured successfully');
      console.log(
        '💡 Postman collections will be validated before each commit',
      );
      return true;
    } catch (error) {
      console.error('❌ Error setting up Git hooks:', error.message);
      return false;
    }
  }

  // Install Newman for API testing
  installNewman() {
    console.log('📦 Installing Newman (Postman CLI) dependencies...');

    try {
      // Check if npm is available
      execSync('npm --version', { stdio: 'ignore' });

      // Install dependencies
      execSync('npm install', { cwd: this.postmanDir, stdio: 'inherit' });

      console.log('✅ Newman dependencies installed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error installing Newman:', error.message);
      console.log(
        '💡 You can install manually with: npm install -g newman newman-reporter-htmlextra',
      );
      return false;
    }
  }

  // Create reports directory
  createReportsDir() {
    const reportsDir = path.join(this.postmanDir, 'reports');

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
      console.log('📁 Created reports directory');

      // Create .gitignore for reports
      const gitignoreContent = `# Newman test reports
*.html
*.json
*.xml
!.gitkeep
`;
      fs.writeFileSync(path.join(reportsDir, '.gitignore'), gitignoreContent);
      fs.writeFileSync(path.join(reportsDir, '.gitkeep'), '');

      console.log('📝 Added .gitignore for test reports');
    }
  }

  // Validate current setup
  validateSetup() {
    console.log('🔍 Validating current setup...');

    const checks = [
      {
        name: 'Git repository',
        check: () => this.isGitRepo(),
        required: false,
      },
      {
        name: 'Postman collection',
        check: () =>
          fs.existsSync(
            path.join(
              this.postmanDir,
              'collections',
              'MU-Compass-API.postman_collection.json',
            ),
          ),
        required: true,
      },
      {
        name: 'Environment files',
        check: () =>
          fs.existsSync(
            path.join(
              this.postmanDir,
              'environments',
              'development.postman_environment.json',
            ),
          ),
        required: true,
      },
      {
        name: 'Management script',
        check: () =>
          fs.existsSync(
            path.join(this.postmanDir, 'scripts', 'manage-postman.js'),
          ),
        required: true,
      },
      {
        name: 'Node.js',
        check: () => {
          try {
            execSync('node --version', { stdio: 'ignore' });
            return true;
          } catch {
            return false;
          }
        },
        required: true,
      },
    ];

    let allValid = true;

    for (const check of checks) {
      const result = check.check();
      const status = result ? '✅' : check.required ? '❌' : '⚠️ ';
      console.log(`${status} ${check.name}`);

      if (!result && check.required) {
        allValid = false;
      }
    }

    return allValid;
  }

  // Show usage instructions
  showUsage() {
    console.log(`
📋 Postman Collection Sync Setup

Usage: node scripts/setup-sync.js [command]

Commands:
  install     Install all dependencies and setup hooks
  hooks       Setup Git hooks only
  newman      Install Newman dependencies only
  validate    Validate current setup
  help        Show this help message

Examples:
  node scripts/setup-sync.js install    # Full setup
  node scripts/setup-sync.js validate   # Check current setup
  node scripts/setup-sync.js hooks      # Setup Git hooks only

📁 Directory Structure:
  postman/
  ├── collections/           # Postman collection files
  ├── environments/          # Environment configurations
  ├── scripts/              # Management and setup scripts
  ├── tests/                # Test suites and helpers
  └── reports/              # Generated test reports

🔧 Available Scripts:
  npm run validate          # Validate collections
  npm run test             # Run API tests
  npm run test:report      # Generate HTML test report

🔄 Git Integration:
  - Pre-commit hooks validate collections
  - GitHub Actions run on postman/ changes
  - Automatic validation on push/PR

📖 Documentation:
  See README.md for detailed usage instructions
`);
  }

  // Main setup function
  async setup(command = 'install') {
    console.log('🚀 MU-Compass Postman Collection Setup\n');

    switch (command) {
      case 'install':
        console.log('📦 Running full installation...\n');

        if (!this.validateSetup()) {
          console.log('\n❌ Setup validation failed');
          console.log('💡 Please fix the issues above before continuing');
          return false;
        }

        this.createReportsDir();
        this.installNewman();
        this.setupGitHooks();

        console.log('\n🎉 Setup completed successfully!');
        console.log('💡 You can now run: npm run validate');
        break;

      case 'hooks':
        this.setupGitHooks();
        break;

      case 'newman':
        this.installNewman();
        break;

      case 'validate':
        const isValid = this.validateSetup();
        console.log(
          `\n${isValid ? '✅ Setup is valid' : '❌ Setup has issues'}`,
        );
        return isValid;

      case 'help':
        this.showUsage();
        break;

      default:
        console.log(`❌ Unknown command: ${command}`);
        this.showUsage();
        return false;
    }

    return true;
  }
}

// CLI interface
if (require.main === module) {
  const setup = new PostmanSetup();
  const command = process.argv[2] || 'install';

  setup
    .setup(command)
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = PostmanSetup;
