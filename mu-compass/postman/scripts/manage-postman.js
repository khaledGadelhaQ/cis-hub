#!/usr/bin/env node
/**
 * Postman Collection Management Script
 * Helps manage and sync Postman collections with the repository
 */

const fs = require('fs');
const path = require('path');

const COLLECTIONS_DIR = path.join(__dirname, '..', 'collections');
const ENVIRONMENTS_DIR = path.join(__dirname, '..', 'environments');

class PostmanManager {
  constructor() {
    this.collectionPath = path.join(
      COLLECTIONS_DIR,
      'MU-Compass-API.postman_collection.json',
    );
    this.environments = [
      'development.postman_environment.json',
      'staging.postman_environment.json',
      'production.postman_environment.json',
    ];
  }

  // Validate JSON files
  validateJson(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      JSON.parse(content);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Validate collection structure
  validateCollection() {
    console.log('🔍 Validating Postman collection...');

    if (!fs.existsSync(this.collectionPath)) {
      console.error('❌ Collection file not found:', this.collectionPath);
      return false;
    }

    const validation = this.validateJson(this.collectionPath);
    if (!validation.valid) {
      console.error('❌ Invalid collection JSON:', validation.error);
      return false;
    }

    try {
      const collection = JSON.parse(
        fs.readFileSync(this.collectionPath, 'utf8'),
      );

      // Check required properties
      if (!collection.info || !collection.info.name) {
        console.error('❌ Collection missing info.name');
        return false;
      }

      if (!collection.item || !Array.isArray(collection.item)) {
        console.error('❌ Collection missing items array');
        return false;
      }

      console.log('✅ Collection validation passed');
      console.log(`📋 Collection: ${collection.info.name}`);
      console.log(`📁 Folders: ${collection.item.length}`);

      return true;
    } catch (error) {
      console.error('❌ Collection validation error:', error.message);
      return false;
    }
  }

  // Validate environment files
  validateEnvironments() {
    console.log('🌍 Validating environment files...');

    let allValid = true;

    for (const envFile of this.environments) {
      const envPath = path.join(ENVIRONMENTS_DIR, envFile);

      if (!fs.existsSync(envPath)) {
        console.warn(`⚠️  Environment file not found: ${envFile}`);
        continue;
      }

      const validation = this.validateJson(envPath);
      if (!validation.valid) {
        console.error(
          `❌ Invalid environment JSON (${envFile}):`,
          validation.error,
        );
        allValid = false;
        continue;
      }

      try {
        const env = JSON.parse(fs.readFileSync(envPath, 'utf8'));

        if (!env.name || !env.values) {
          console.error(
            `❌ Environment ${envFile} missing required properties`,
          );
          allValid = false;
          continue;
        }

        console.log(`✅ ${env.name} environment valid`);
      } catch (error) {
        console.error(
          `❌ Environment validation error (${envFile}):`,
          error.message,
        );
        allValid = false;
      }
    }

    return allValid;
  }

  // Generate collection info
  getCollectionInfo() {
    if (!fs.existsSync(this.collectionPath)) {
      return null;
    }

    try {
      const collection = JSON.parse(
        fs.readFileSync(this.collectionPath, 'utf8'),
      );

      const info = {
        name: collection.info.name,
        description: collection.info.description,
        folders: collection.item.length,
        totalRequests: 0,
        variables: collection.variable ? collection.variable.length : 0,
      };

      // Count total requests recursively
      const countRequests = (items) => {
        let count = 0;
        for (const item of items) {
          if (item.request) {
            count++;
          } else if (item.item) {
            count += countRequests(item.item);
          }
        }
        return count;
      };

      info.totalRequests = countRequests(collection.item);
      return info;
    } catch (error) {
      console.error('Error reading collection info:', error.message);
      return null;
    }
  }

  // Update collection metadata
  updateCollectionMetadata() {
    console.log('📝 Updating collection metadata...');

    try {
      const collection = JSON.parse(
        fs.readFileSync(this.collectionPath, 'utf8'),
      );

      // Update timestamp
      collection.info.updatedAt = new Date().toISOString();

      // Add version if not exists
      if (!collection.info.version) {
        collection.info.version = '1.0.0';
      }

      // Write back to file
      fs.writeFileSync(
        this.collectionPath,
        JSON.stringify(collection, null, 2),
        'utf8',
      );

      console.log('✅ Collection metadata updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating metadata:', error.message);
      return false;
    }
  }

  // Main validation function
  validate() {
    console.log('🚀 Starting Postman collection validation...\n');

    const collectionValid = this.validateCollection();
    const environmentsValid = this.validateEnvironments();

    console.log('\n📊 Validation Summary:');
    console.log(`Collection: ${collectionValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(
      `Environments: ${environmentsValid ? '✅ Valid' : '❌ Invalid'}`,
    );

    if (collectionValid && environmentsValid) {
      console.log('\n🎉 All validations passed!');

      const info = this.getCollectionInfo();
      if (info) {
        console.log('\n📋 Collection Summary:');
        console.log(`Name: ${info.name}`);
        console.log(`Folders: ${info.folders}`);
        console.log(`Total Requests: ${info.totalRequests}`);
        console.log(`Variables: ${info.variables}`);
      }

      return true;
    } else {
      console.log('\n❌ Validation failed!');
      return false;
    }
  }

  // Check for updates needed
  checkForUpdates() {
    console.log('🔄 Checking for collection updates...');

    // This would integrate with Postman API to check for updates
    // For now, just check file modification times

    try {
      const stats = fs.statSync(this.collectionPath);
      const lastModified = stats.mtime;
      const daysSinceUpdate =
        (Date.now() - lastModified.getTime()) / (1000 * 60 * 60 * 24);

      console.log(`📅 Last updated: ${lastModified.toLocaleDateString()}`);
      console.log(`⏰ Days since update: ${Math.floor(daysSinceUpdate)}`);

      if (daysSinceUpdate > 7) {
        console.log("⚠️  Collection hasn't been updated in over a week");
        console.log('💡 Consider syncing with latest Postman workspace');
      }
    } catch (error) {
      console.error('Error checking update status:', error.message);
    }
  }
}

// CLI interface
function main() {
  const manager = new PostmanManager();
  const command = process.argv[2];

  switch (command) {
    case 'validate':
      process.exit(manager.validate() ? 0 : 1);
      break;

    case 'info':
      const info = manager.getCollectionInfo();
      if (info) {
        console.log(JSON.stringify(info, null, 2));
      } else {
        console.error('Could not read collection info');
        process.exit(1);
      }
      break;

    case 'update-metadata':
      process.exit(manager.updateCollectionMetadata() ? 0 : 1);
      break;

    case 'check-updates':
      manager.checkForUpdates();
      break;

    default:
      console.log(`
📋 Postman Collection Manager

Usage: node manage-postman.js <command>

Commands:
  validate        Validate collection and environment files
  info           Show collection information
  update-metadata Update collection metadata (timestamp, version)
  check-updates  Check when collection was last updated

Examples:
  node manage-postman.js validate
  node manage-postman.js info
  node manage-postman.js update-metadata
`);
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = PostmanManager;
