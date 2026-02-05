const moduleAlias = require('module-alias');
import path from 'path';

moduleAlias.addAliases({
  '@/services/storage': path.resolve(__dirname, 'mocks/storage'),
  '@/services/correspondence': path.resolve(__dirname, 'mocks/correspondence'),
  '@': path.resolve(__dirname, '..'),
});

const { storage } = require('@/services/storage');
console.log('Storage loaded:', !!storage);
