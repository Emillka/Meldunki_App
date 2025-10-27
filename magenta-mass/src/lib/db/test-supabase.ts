import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Test environment configuration
const getTestConfig = () => {
  // In test environment, use test database
  if (process.env.NODE_ENV === 'test' || process.env.CI) {
    return {
      url: process.env.TEST_SUPABASE_URL || 'https://your-test-project.supabase.co',
      anonKey: process.env.TEST_SUPABASE_ANON_KEY || 'your-test-anon-key',
      serviceRoleKey: process.env.TEST_SUPABASE_SERVICE_ROLE_KEY || 'your-test-service-role-key'
    };
  }
  
  // In development/production, use regular config
  return {
    url: import.meta.env.PUBLIC_SUPABASE_URL,
    anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    serviceRoleKey: import.meta.env.PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  };
};

const config = getTestConfig();

if (!config.url || !config.anonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create test client for E2E tests
export const testSupabaseClient = createClient<Database>(config.url, config.anonKey);

// Create service role client for test setup/teardown
export const testSupabaseServiceClient = createClient<Database>(
  config.url, 
  config.serviceRoleKey
);

// Test user credentials
export const TEST_CREDENTIALS = {
  user: {
    email: process.env.TEST_USER_EMAIL || 'test@example.com',
    password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
    fireDepartmentId: process.env.TEST_FIRE_DEPARTMENT_ID || '550e8400-e29b-41d4-a716-446655440000'
  },
  admin: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
    password: process.env.TEST_ADMIN_PASSWORD || 'AdminPassword123!'
  }
};

// Test data helpers
export const TEST_DATA = {
  fireDepartment: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    name: 'OSP Test Warszawa',
    county_id: '550e8400-e29b-41d4-a716-446655440001'
  },
  sampleMeldunki: [
    {
      incident_name: 'Test Pożar',
      incident_date: '2024-01-15',
      description: 'Testowy meldunek pożaru',
      location_address: 'ul. Testowa 1, Warszawa',
      commander: 'Jan Kowalski',
      driver: 'Piotr Nowak',
      forces_and_resources: '2 pojazdy, 8 strażaków'
    },
    {
      incident_name: 'Test Wypadek',
      incident_date: '2024-01-20',
      description: 'Testowy meldunek wypadku',
      location_address: 'ul. Główna 5, Warszawa',
      commander: 'Anna Wiśniewska',
      driver: 'Marek Zieliński',
      forces_and_resources: '1 pojazd, 4 strażaków'
    }
  ]
};

// Test utilities
export const testUtils = {
  // Clean up test data
  async cleanupTestData() {
    try {
      // Delete test users
      await testSupabaseServiceClient.auth.admin.deleteUser(
        TEST_CREDENTIALS.user.email
      );
      await testSupabaseServiceClient.auth.admin.deleteUser(
        TEST_CREDENTIALS.admin.email
      );
      
      // Delete test incidents
      await testSupabaseServiceClient
        .from('incidents')
        .delete()
        .like('incident_name', 'Test%');
        
      console.log('Test data cleaned up successfully');
    } catch (error) {
      console.warn('Error cleaning up test data:', error);
    }
  },
  
  // Setup test data
  async setupTestData() {
    try {
      // Create test fire department if not exists
      const { data: existingDept } = await testSupabaseServiceClient
        .from('fire_departments')
        .select('id')
        .eq('id', TEST_DATA.fireDepartment.id)
        .single();
        
      if (!existingDept) {
        await testSupabaseServiceClient
          .from('fire_departments')
          .insert(TEST_DATA.fireDepartment);
      }
      
      console.log('Test data setup completed');
    } catch (error) {
      console.warn('Error setting up test data:', error);
    }
  }
};
