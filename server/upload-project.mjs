import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET_NAME = process.env.BUCKET_NAME || 'codebase';

/*
 * Change this to the local project you want to test.
 *
 * Example:
 * /home/abhishek-soni/Documents/test-project
 */
const PROJECT_PATH =
  '/home/abhishek-soni/Documents/test-project';

const PROJECT_ID = 'test-project-001';

const IGNORE = new Set([
  'node_modules',
  '.git',
  'target',
  'dist',
  '.DS_Store'
]);

async function getFiles(directory) {
  const entries = await fs.readdir(directory, {
    withFileTypes: true
  });

  const files = [];

  for (const entry of entries) {
    if (IGNORE.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      const nestedFiles = await getFiles(fullPath);
      files.push(...nestedFiles);
    } else {
      files.push(fullPath);
    }
  }

  return files;
}

async function uploadProject() {
  console.log('================================');
  console.log('Contri.Code Project Upload');
  console.log('================================');

  console.log(`Local project: ${PROJECT_PATH}`);
  console.log(`Project ID: ${PROJECT_ID}`);
  console.log(`Bucket: ${BUCKET_NAME}`);
  console.log('');

  const files = await getFiles(PROJECT_PATH);

  console.log(`Found ${files.length} files.`);
  console.log('');

  for (const filePath of files) {
    const relativePath = path.relative(
      PROJECT_PATH,
      filePath
    );

    /*
     * Convert Linux filesystem paths to
     * storage paths.
     */
    const storagePath = `${PROJECT_ID}/${relativePath
      .split(path.sep)
      .join('/')}`;

    console.log(`Uploading: ${storagePath}`);

    const fileBuffer = await fs.readFile(filePath);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, fileBuffer, {
        upsert: true,
        contentType: getContentType(filePath)
      });

    if (error) {
      console.error(
        `FAILED: ${storagePath}`
      );

      console.error(error);
      continue;
    }

    console.log(`✓ Uploaded`);
  }

  console.log('');
  console.log('================================');
  console.log('Upload complete');
  console.log('================================');
}

function getContentType(filePath) {
  const extension = path
    .extname(filePath)
    .toLowerCase();

  const types = {
    '.js': 'text/javascript',
    '.jsx': 'text/javascript',
    '.ts': 'text/typescript',
    '.tsx': 'text/typescript',
    '.json': 'application/json',
    '.html': 'text/html',
    '.css': 'text/css',
    '.scss': 'text/css',
    '.md': 'text/markdown',
    '.txt': 'text/plain',
    '.xml': 'application/xml',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  };

  return types[extension] || 'application/octet-stream';
}

uploadProject().catch((error) => {
  console.error('');
  console.error('Upload failed:');
  console.error(error);
  process.exit(1);
});