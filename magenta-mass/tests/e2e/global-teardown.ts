import type { FullConfig } from '@playwright/test';
import { testUtils } from '../../src/lib/db/test-supabase';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting E2E test cleanup...');
  
  try {
    // Clean up test data
    await testUtils.cleanupTestData();
    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.error('❌ Error during test cleanup:', error);
    // Don't throw error during cleanup to avoid masking test failures
  }
}

export default globalTeardown;
