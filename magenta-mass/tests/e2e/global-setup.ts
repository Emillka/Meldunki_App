import type { FullConfig } from '@playwright/test';
import { testSupabaseServiceClient, testUtils } from '../../src/lib/db/test-supabase';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');
  
  try {
    // Setup test data
    await testUtils.setupTestData();
    console.log('✅ Test data setup completed');
  } catch (error) {
    console.error('❌ Error during test setup:', error);
    throw error;
  }
}

export default globalSetup;
