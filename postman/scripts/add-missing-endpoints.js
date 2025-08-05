#!/usr/bin/env node
/**
 * Add Missing Endpoints to Postman Collection
 * Adds Posts/News/Feed and new Chat File endpoints
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

// Add new collection variables if they don't exist
const newVariables = [
  { key: 'postId', value: '', type: 'string' },
  { key: 'messageId', value: '', type: 'string' },
  { key: 'roomId', value: '', type: 'string' },
  { key: 'attachmentId', value: '', type: 'string' },
];

newVariables.forEach((newVar) => {
  if (!collection.variable.find((v) => v.key === newVar.key)) {
    collection.variable.push(newVar);
  }
});

// Posts/News/Feed Module
const postsModule = {
  name: '📰 Posts/News/Feed',
  description: 'University posts, news, announcements, and feed management',
  item: [
    {
      name: '📝 Post Management',
      description: 'Core post operations - create, read, update, delete posts',
      item: [
        {
          name: 'Create Post',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'if (pm.response.code === 201) {',
                  '    const response = pm.response.json();',
                  "    pm.collectionVariables.set('postId', response.id);",
                  "    console.log('Post created with ID:', response.id);",
                  '}',
                ],
              },
            },
          ],
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: '{\n  "title": "Important Announcement",\n  "content": "This is a test post from Postman",\n  "postType": "ANNOUNCEMENT",\n  "scope": "DEPARTMENT",\n  "priority": "HIGH",\n  "publishedAt": "{{$isoTimestamp}}",\n  "attachmentIds": []\n}',
            },
            url: {
              raw: '{{baseUrl}}/posts',
              host: ['{{baseUrl}}'],
              path: ['posts'],
            },
          },
          response: [],
        },
        {
          name: 'Get All Posts (Feed)',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts?page=1&limit=20&sortBy=createdAt&sortOrder=desc',
              host: ['{{baseUrl}}'],
              path: ['posts'],
              query: [
                { key: 'page', value: '1' },
                { key: 'limit', value: '20' },
                { key: 'sortBy', value: 'createdAt' },
                { key: 'sortOrder', value: 'desc' },
                { key: 'postType', value: '', disabled: true },
                { key: 'scope', value: '', disabled: true },
                { key: 'priority', value: '', disabled: true },
                { key: 'search', value: '', disabled: true },
              ],
            },
          },
          response: [],
        },
        {
          name: 'Get Pinned Posts',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/pinned',
              host: ['{{baseUrl}}'],
              path: ['posts', 'pinned'],
            },
          },
          response: [],
        },
        {
          name: 'Search Posts',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/search?search=announcement&page=1&limit=20',
              host: ['{{baseUrl}}'],
              path: ['posts', 'search'],
              query: [
                { key: 'search', value: 'announcement' },
                { key: 'page', value: '1' },
                { key: 'limit', value: '20' },
                { key: 'postType', value: '', disabled: true },
                { key: 'scope', value: '', disabled: true },
              ],
            },
          },
          response: [],
        },
        {
          name: 'Get Post by ID',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/{{postId}}',
              host: ['{{baseUrl}}'],
              path: ['posts', '{{postId}}'],
            },
          },
          response: [],
        },
        {
          name: 'Update Post',
          request: {
            method: 'PATCH',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: '{\n  "title": "Updated Post Title",\n  "content": "Updated post content",\n  "priority": "MEDIUM"\n}',
            },
            url: {
              raw: '{{baseUrl}}/posts/{{postId}}',
              host: ['{{baseUrl}}'],
              path: ['posts', '{{postId}}'],
            },
          },
          response: [],
        },
        {
          name: 'Delete Post',
          request: {
            method: 'DELETE',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/{{postId}}',
              host: ['{{baseUrl}}'],
              path: ['posts', '{{postId}}'],
            },
          },
          response: [],
        },
        {
          name: 'Toggle Pin Post (Admin)',
          request: {
            method: 'POST',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/{{postId}}/pin',
              host: ['{{baseUrl}}'],
              path: ['posts', '{{postId}}', 'pin'],
            },
          },
          response: [],
        },
        {
          name: 'Get Post Attachments',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/{{postId}}/attachments',
              host: ['{{baseUrl}}'],
              path: ['posts', '{{postId}}', 'attachments'],
            },
          },
          response: [],
        },
      ],
    },
    {
      name: '📎 Post File Management',
      description: 'File upload and management for posts',
      item: [
        {
          name: 'Upload Post Files',
          event: [
            {
              listen: 'test',
              script: {
                exec: [
                  'if (pm.response.code === 201) {',
                  '    const response = pm.response.json();',
                  '    if (response.files && response.files.length > 0) {',
                  "        pm.collectionVariables.set('attachmentId', response.files[0].id);",
                  "        console.log('Post file uploaded with ID:', response.files[0].id);",
                  '    }',
                  '}',
                ],
              },
            },
          ],
          request: {
            method: 'POST',
            header: [],
            body: {
              mode: 'formdata',
              formdata: [
                {
                  key: 'files',
                  type: 'file',
                  src: [],
                },
                {
                  key: 'context',
                  value: 'POST',
                  type: 'text',
                },
              ],
            },
            url: {
              raw: '{{baseUrl}}/posts/files/upload',
              host: ['{{baseUrl}}'],
              path: ['posts', 'files', 'upload'],
            },
          },
          response: [],
        },
        {
          name: 'Associate Files with Post',
          request: {
            method: 'POST',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: '{\n  "fileIds": ["{{attachmentId}}"],\n  "contextId": "{{postId}}"\n}',
            },
            url: {
              raw: '{{baseUrl}}/posts/files/associate',
              host: ['{{baseUrl}}'],
              path: ['posts', 'files', 'associate'],
            },
          },
          response: [],
        },
        {
          name: 'Get Post Files',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/files?context=POST&contextId={{postId}}&limit=20',
              host: ['{{baseUrl}}'],
              path: ['posts', 'files'],
              query: [
                { key: 'context', value: 'POST' },
                { key: 'contextId', value: '{{postId}}' },
                { key: 'limit', value: '20' },
              ],
            },
          },
          response: [],
        },
        {
          name: 'Download Post File',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/files/{{attachmentId}}/download',
              host: ['{{baseUrl}}'],
              path: ['posts', 'files', '{{attachmentId}}', 'download'],
            },
          },
          response: [],
        },
        {
          name: 'Get Post File Statistics',
          request: {
            method: 'GET',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/files/stats?context=POST&contextId={{postId}}',
              host: ['{{baseUrl}}'],
              path: ['posts', 'files', 'stats'],
              query: [
                { key: 'context', value: 'POST' },
                { key: 'contextId', value: '{{postId}}' },
              ],
            },
          },
          response: [],
        },
        {
          name: 'Remove File from Post',
          request: {
            method: 'DELETE',
            header: [
              {
                key: 'Content-Type',
                value: 'application/json',
              },
            ],
            body: {
              mode: 'raw',
              raw: '{\n  "fileIds": ["{{attachmentId}}"],\n  "contextId": "{{postId}}"\n}',
            },
            url: {
              raw: '{{baseUrl}}/posts/files/remove',
              host: ['{{baseUrl}}'],
              path: ['posts', 'files', 'remove'],
            },
          },
          response: [],
        },
        {
          name: 'Delete Post File',
          request: {
            method: 'DELETE',
            header: [],
            url: {
              raw: '{{baseUrl}}/posts/files/{{attachmentId}}',
              host: ['{{baseUrl}}'],
              path: ['posts', 'files', '{{attachmentId}}'],
            },
          },
          response: [],
        },
      ],
    },
  ],
};

// New Chat File Endpoints to add to existing Chat File Management
const newChatFileEndpoints = [
  {
    name: 'Serve Chat File',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/chat/files/{{chatFileId}}/serve',
        host: ['{{baseUrl}}'],
        path: ['chat', 'files', '{{chatFileId}}', 'serve'],
      },
    },
    response: [],
  },
  {
    name: 'Download Chat File',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/chat/files/{{chatFileId}}/download',
        host: ['{{baseUrl}}'],
        path: ['chat', 'files', '{{chatFileId}}', 'download'],
      },
    },
    response: [],
  },
  {
    name: 'Get Chat File Thumbnail',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/chat/files/{{chatFileId}}/thumbnails/medium',
        host: ['{{baseUrl}}'],
        path: ['chat', 'files', '{{chatFileId}}', 'thumbnails', 'medium'],
      },
    },
    response: [],
  },
  {
    name: 'Get Files from Message',
    event: [
      {
        listen: 'test',
        script: {
          exec: [
            'if (pm.response.code === 200) {',
            '    const response = pm.response.json();',
            '    if (response.files && response.files.length > 0) {',
            "        pm.collectionVariables.set('chatFileId', response.files[0].id);",
            "        console.log('Message file found with ID:', response.files[0].id);",
            '    }',
            '}',
          ],
        },
      },
    ],
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/chat/files/message/{{messageId}}',
        host: ['{{baseUrl}}'],
        path: ['chat', 'files', 'message', '{{messageId}}'],
      },
    },
    response: [],
  },
  {
    name: 'Get Accessible Chat Files',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/chat/files/accessible?limit=20&offset=0&fileType=image',
        host: ['{{baseUrl}}'],
        path: ['chat', 'files', 'accessible'],
        query: [
          { key: 'limit', value: '20' },
          { key: 'offset', value: '0' },
          { key: 'fileType', value: 'image', disabled: true },
        ],
      },
    },
    response: [],
  },
  {
    name: 'Search Chat Files',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/chat/files/search?q=document&type=document&limit=20',
        host: ['{{baseUrl}}'],
        path: ['chat', 'files', 'search'],
        query: [
          { key: 'q', value: 'document' },
          { key: 'type', value: 'document', disabled: true },
          { key: 'limit', value: '20' },
        ],
      },
    },
    response: [],
  },
  {
    name: 'Get Chat File Metadata',
    request: {
      method: 'GET',
      header: [],
      url: {
        raw: '{{baseUrl}}/chat/files/{{chatFileId}}/metadata',
        host: ['{{baseUrl}}'],
        path: ['chat', 'files', '{{chatFileId}}', 'metadata'],
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

// Add Posts/News/Feed module
const postsFolder = findFolderByName(collection.item, '📰 Posts/News/Feed');
if (!postsFolder) {
  // Find a good position to insert (after Files Management, before WebSocket Testing)
  const filesFolder = findFolderByName(collection.item, '📁 Files Management');
  const insertIndex = filesFolder
    ? filesFolder.index + 1
    : collection.item.length - 1;

  collection.item.splice(insertIndex, 0, postsModule);
  console.log('✅ Added Posts/News/Feed module');
} else {
  console.log('ℹ️ Posts/News/Feed module already exists');
}

// Add new endpoints to existing Chat File Management
const chatFileFolder = findFolderByName(
  collection.item,
  '💬 Chat File Management',
);
if (chatFileFolder) {
  // Check which endpoints are missing and add them
  const existingEndpoints = chatFileFolder.folder.item.map((item) => item.name);

  newChatFileEndpoints.forEach((endpoint) => {
    if (!existingEndpoints.includes(endpoint.name)) {
      chatFileFolder.folder.item.push(endpoint);
      console.log(`✅ Added chat endpoint: ${endpoint.name}`);
    } else {
      console.log(`ℹ️ Chat endpoint already exists: ${endpoint.name}`);
    }
  });
} else {
  console.log('⚠️ Chat File Management folder not found');
}

// Write updated collection
fs.writeFileSync(COLLECTION_PATH, JSON.stringify(collection, null, 2));
console.log('\n🎉 Postman collection updated successfully!');
console.log('\n📊 Summary:');
console.log('- Added Posts/News/Feed module with complete CRUD operations');
console.log('- Added Post file management endpoints');
console.log('- Enhanced Chat file management with new endpoints');
console.log('- Added necessary collection variables (postId, messageId, etc.)');
console.log('\n💡 You can now:');
console.log('1. Create and manage posts/announcements');
console.log('2. Upload and associate files with posts');
console.log('3. Search and filter posts');
console.log(
  '4. Access new chat file endpoints (serve, download, thumbnails, etc.)',
);
console.log('5. Search and browse chat files by type');
