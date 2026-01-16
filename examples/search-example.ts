#!/usr/bin/env node

import { loadConfig, getConfig } from '../src/config.js';
import { getSearchService, getCache } from '../src/services.js';

async function main(): Promise<void> {
  loadConfig();
  const config = getConfig();
  
  console.log('PanSou Node.js Search Example');
  console.log('============================\n');
  console.log(`Server: http://localhost:${config.port}`);
  console.log(`Auth: ${config.authEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`Plugins: ${config.asyncPluginEnabled ? 'Enabled' : 'Disabled'}`);
  console.log(`Channels: ${config.defaultChannels.join(', ')}\n`);

  const searchService = getSearchService();
  const cache = getCache();

  console.log('Usage:');
  console.log('  POST http://localhost:' + config.port + '/api/search');
  console.log('  Body: {"kw": "搜索关键词"}');
  console.log('\nOr use the built search function:');

  const testKeyword = process.argv[2] || '测试';
  console.log(`\nSearching for: ${testKeyword}`);

  try {
    const results = await searchService.search({
      kw: testKeyword,
      res: 'merge',
      src: 'all'
    });

    console.log(`\nFound ${results.total} results\n`);

    for (const [type, links] of Object.entries(results.merged_by_type)) {
      if (links.length > 0) {
        console.log(`\n${type} (${links.length}):`);
        for (const link of links.slice(0, 3)) {
          console.log(`  - ${link.url.substring(0, 60)}...`);
        }
        if (links.length > 3) {
          console.log(`  ... and ${links.length - 3} more`);
        }
      }
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
}

main().catch(console.error);
