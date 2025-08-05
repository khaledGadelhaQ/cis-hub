#!/usr/bin/env node
/**
 * Add Specialized Feed Endpoints to Postman Collection
 * Adds user-specific feed endpoints for better UX
 */

const fs = require('fs');
const path = require('path');

const COLLECTION_PATH = path.join(
  __dirname,
  '..',
  'collections',
  'CIS-HUB-API.postman_collection.json',
);

// Load current collection
const collection = JSON.parse(fs.readFileSync(COLLECTION_PATH, 'utf8'));

// New specialized feed endpoints
const feedEndpoints = [
  {
    name: 'Get My Department Feed',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/posts/feed/my-department?page=1&limit=20&sortBy=publishedAt&sortOrder=desc',
        host: ['{{baseUrl}}'],
        path: ['posts', 'feed', 'my-department'],
        query: [
          { key: 'page', value: '1' },
          { key: 'limit', value: '20' },
          { key: 'sortBy', value: 'publishedAt' },
          { key: 'sortOrder', value: 'desc' },
          { key: 'priority', value: '', disabled: true },
          { key: 'postType', value: '', disabled: true },
        ],
      },
    },
    response: [],
  },
  {
    name: 'Get My Year Feed',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/posts/feed/my-year?page=1&limit=20&sortBy=publishedAt&sortOrder=desc',
        host: ['{{baseUrl}}'],
        path: ['posts', 'feed', 'my-year'],
        query: [
          { key: 'page', value: '1' },
          { key: 'limit', value: '20' },
          { key: 'sortBy', value: 'publishedAt' },
          { key: 'sortOrder', value: 'desc' },
          { key: 'priority', value: '', disabled: true },
        ],
      },
    },
    response: [],
  },
  {
    name: 'Get Announcements Feed',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/posts/feed/announcements?page=1&limit=20&scope=DEPARTMENT',
        host: ['{{baseUrl}}'],
        path: ['posts', 'feed', 'announcements'],
        query: [
          { key: 'page', value: '1' },
          { key: 'limit', value: '20' },
          { key: 'scope', value: 'DEPARTMENT', disabled: true },
          { key: 'priority', value: '', disabled: true },
        ],
      },
    },
    response: [],
  },
  {
    name: 'Get Assignments Feed (Events)',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/posts/feed/assignments?page=1&limit=20&scope=DEPARTMENT',
        host: ['{{baseUrl}}'],
        path: ['posts', 'feed', 'assignments'],
        query: [
          { key: 'page', value: '1' },
          { key: 'limit', value: '20' },
          { key: 'scope', value: 'DEPARTMENT', disabled: true },
          { key: 'priority', value: '', disabled: true },
        ],
      },
    },
    response: [],
  },
  {
    name: 'Get Global Feed',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/posts/feed/global?page=1&limit=20&postType=ANNOUNCEMENT',
        host: ['{{baseUrl}}'],
        path: ['posts', 'feed', 'global'],
        query: [
          { key: 'page', value: '1' },
          { key: 'limit', value: '20' },
          { key: 'postType', value: 'ANNOUNCEMENT', disabled: true },
          { key: 'priority', value: '', disabled: true },
        ],
      },
    },
    response: [],
  },
  {
    name: 'Get Urgent Feed',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/posts/feed/urgent?page=1&limit=20',
        host: ['{{baseUrl}}'],
        path: ['posts', 'feed', 'urgent'],
        query: [
          { key: 'page', value: '1' },
          { key: 'limit', value: '20' },
          { key: 'scope', value: '', disabled: true },
          { key: 'postType', value: '', disabled: true },
        ],
      },
    },
    response: [],
  },
];

// Function to find folder by name
function findFolderByName(items, name) {
  for (let i = 0; i < items.length; i++) {
    if (items[i].name === name) {
      return { folder: items[i], index: i };
    }
  }
  return null;
}

// Find the Posts/News/Feed module
const postsFolder = findFolderByName(collection.item, '📰 Posts/News/Feed');
if (postsFolder) {
  // Find the Post Management subfolder
  const postManagementFolder = findFolderByName(
    postsFolder.folder.item,
    '📝 Post Management',
  );
  if (postManagementFolder) {
    // Create a new Specialized Feeds subfolder
    const specializedFeedsFolder = {
      name: '🎯 Specialized Feeds',
      description:
        'User-specific feed endpoints for different content types and scopes',
      item: feedEndpoints,
    };

    // Insert the new folder after Post Management
    postsFolder.folder.item.splice(
      postManagementFolder.index + 1,
      0,
      specializedFeedsFolder,
    );
    console.log('✅ Added Specialized Feeds subfolder with 6 new endpoints');
  } else {
    // If Post Management folder doesn't exist, add to the main folder
    postsFolder.folder.item.push({
      name: '🎯 Specialized Feeds',
      description:
        'User-specific feed endpoints for different content types and scopes',
      item: feedEndpoints,
    });
    console.log('✅ Added Specialized Feeds folder to Posts module');
  }
} else {
  console.log('⚠️ Posts/News/Feed module not found in collection');
}

// Write updated collection
fs.writeFileSync(COLLECTION_PATH, JSON.stringify(collection, null, 2));
console.log('\n🎉 Postman collection updated successfully!');
console.log('\n📊 Added Specialized Feed Endpoints:');
console.log('1. Get My Department Feed - Department-specific posts');
console.log('2. Get My Year Feed - Year-specific posts');
console.log('3. Get Announcements Feed - Announcements only');
console.log('4. Get Assignments Feed - Event/assignment posts');
console.log('5. Get Global Feed - University-wide posts');
console.log('6. Get Urgent Feed - High priority posts');
console.log('\n💡 User Benefits:');
console.log('- Students: Quick access to department and year-specific content');
console.log('- TAs: Easy filtering of announcements and assignments');
console.log('- Professors: Streamlined access to different post types');
console.log('- Admins: Global overview and urgent post monitoring');
console.log('\n🎯 Each endpoint supports:');
console.log('- Pagination (page, limit)');
console.log('- Sorting (sortBy, sortOrder)');
console.log('- Additional filtering (priority, postType, scope)');
