import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { AuthService } from '@/lib/services/auth.service';
import { MeldunkiService } from '@/lib/services/meldunki.service';

// Test database configuration
const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'test-key';
const supabase = createClient(supabaseUrl, supabaseKey);

describe('Database Integration Tests', () => {
  let testUser: any;
  let testProfile: any;
  let testFireDepartment: any;
  let authService: AuthService;
  let meldunkiService: MeldunkiService;

  beforeAll(async () => {
    authService = new AuthService();
    meldunkiService = new MeldunkiService();
    
    // Clean up any existing test data
    await cleanupTestData();
    
    // Create test fire department
    const { data: fireDept, error: fireDeptError } = await supabase
      .from('fire_departments')
      .insert({
        name: 'OSP Test Integration',
        address: 'Test Address 123',
        phone: '123-456-7890',
        email: 'test@osp.com',
        county_id: 1 // Assuming county with ID 1 exists
      })
      .select()
      .single();

    if (fireDeptError) {
      throw new Error(`Failed to create test fire department: ${fireDeptError.message}`);
    }
    testFireDepartment = fireDept;
  });

  afterAll(async () => {
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Create test user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!'
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create test user: ${authError?.message}`);
    }

    testUser = authData.user;

    // Create test profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: testUser.id,
        fire_department_id: testFireDepartment.id,
        first_name: 'Test',
        last_name: 'User',
        role: 'firefighter'
      })
      .select()
      .single();

    if (profileError) {
      throw new Error(`Failed to create test profile: ${profileError.message}`);
    }

    testProfile = profile;
  });

  afterEach(async () => {
    // Clean up test data after each test
    if (testUser) {
      await supabase.auth.admin.deleteUser(testUser.id);
    }
  });

  async function cleanupTestData() {
    // Clean up test incidents
    await supabase
      .from('incidents')
      .delete()
      .like('incident_name', 'Test%');

    // Clean up test profiles
    await supabase
      .from('profiles')
      .delete()
      .like('first_name', 'Test');

    // Clean up test fire department
    await supabase
      .from('fire_departments')
      .delete()
      .eq('name', 'OSP Test Integration');
  }

  describe('Authentication Service Integration', () => {
    it('should create user and profile successfully', async () => {
      const email = `integration-test-${Date.now()}@example.com`;
      const password = 'IntegrationTest123!';

      const { data, error } = await authService.registerUser({
        email,
        password,
        profile: {
          fire_department_id: testFireDepartment.id,
          first_name: 'Integration',
          last_name: 'Test',
          role: 'member'
        }
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user).toBeDefined();
      expect(data?.user.email).toBe(email);

      // Verify profile was created
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data?.user.id)
        .single();

      expect(profileError).toBeNull();
      expect(profile).toBeDefined();
      expect(profile.first_name).toBe('Integration');
      expect(profile.last_name).toBe('Test');
      expect(profile.fire_department_id).toBe(testFireDepartment.id);

      // Clean up
      await supabase.auth.admin.deleteUser(data?.user.id!);
    });

    it('should login user successfully', async () => {
      const { data, error } = await authService.loginUser(testUser.email!, 'TestPassword123!');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user).toBeDefined();
      expect(data?.user.email).toBe(testUser.email);
      expect(data?.session).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const { data, error } = await authService.loginUser(testUser.email!, 'WrongPassword');

      expect(error).toBeDefined();
      expect(error?.message).toBe('INVALID_CREDENTIALS');
      expect(data).toBeNull();
    });

    it('should handle non-existent user', async () => {
      const { data, error } = await authService.loginUser('nonexistent@example.com', 'password');

      expect(error).toBeDefined();
      expect(error?.message).toBe('INVALID_CREDENTIALS');
      expect(data).toBeNull();
    });
  });

  describe('Meldunki Service Integration', () => {
    it('should create meldunek successfully', async () => {
      const meldunekData = {
        title: 'Test Fire Incident',
        description: 'Integration test fire incident',
        location: 'Test Location 123',
        incident_type: 'fire' as const,
        severity: 'high' as const,
        incident_date: '2023-01-01',
        duration_minutes: 120,
        participants_count: 5,
        equipment_used: ['Engine 1', 'Ladder 1'],
        weather_conditions: 'Clear',
        additional_notes: 'Test notes',
        commander: 'Test Commander',
        driver: 'Test Driver'
      };

      const { data, error } = await meldunkiService.createMeldunek({
        user_id: testUser.id,
        fire_department_id: testFireDepartment.id,
        title: 'Test Fire Incident',
        description: 'Integration test fire incident',
        location: 'Test Location 123',
        incident_type: 'fire',
        severity: 'high',
        incident_date: '2023-01-01',
        duration_minutes: 120,
        participants_count: 5,
        equipment_used: ['Engine 1', 'Ladder 1'],
        weather_conditions: 'Clear',
        additional_notes: 'Test notes'
      });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.meldunek.title).toBe('Test Fire Incident');
      expect(data?.meldunek.description).toBe('Integration test fire incident');
      expect(data?.meldunek.fire_department_id).toBe(testFireDepartment.id);

      // Verify incident was created in database
      const { data: incident, error: incidentError } = await supabase
        .from('incidents')
        .select('*')
        .eq('id', data?.meldunek.id)
        .single();

      expect(incidentError).toBeNull();
      expect(incident).toBeDefined();
      expect(incident.incident_name).toBe('Test Fire Incident');
      expect(incident.user_id).toBe(testUser.id);
      expect(incident.fire_department_id).toBe(testFireDepartment.id);
    });

    it('should retrieve meldunki for fire department', async () => {
      // Create test incidents
      const incidents = [
        {
          user_id: testUser.id,
          fire_department_id: testFireDepartment.id,
          incident_name: 'Test Incident 1',
          description: 'First test incident',
          incident_date: '2023-01-01',
          category: 'fire',
          start_time: '2023-01-01T10:00:00Z',
          end_time: '2023-01-01T12:00:00Z'
        },
        {
          user_id: testUser.id,
          fire_department_id: testFireDepartment.id,
          incident_name: 'Test Incident 2',
          description: 'Second test incident',
          incident_date: '2023-01-02',
          category: 'rescue',
          start_time: '2023-01-02T14:00:00Z',
          end_time: '2023-01-02T16:00:00Z'
        }
      ];

      const { data: createdIncidents, error: createError } = await supabase
        .from('incidents')
        .insert(incidents)
        .select();

      expect(createError).toBeNull();
      expect(createdIncidents).toHaveLength(2);

      // Retrieve meldunki
      const { data: meldunki, error } = await meldunkiService.getUserMeldunki(testUser.id);

      expect(error).toBeNull();
      expect(meldunki).toBeDefined();
      expect(meldunki!.length).toBeGreaterThanOrEqual(2);

      // Verify data structure
      const firstMeldunek = meldunki!.find((m: any) => m.title === 'Test Incident 1');
      expect(firstMeldunek).toBeDefined();
      expect(firstMeldunek?.incident_type).toBe('fire');
      expect(firstMeldunek?.duration_minutes).toBe(120);
    });

    it('should not retrieve meldunki from other fire departments', async () => {
      // Create another fire department
      const { data: otherFireDept, error: otherDeptError } = await supabase
        .from('fire_departments')
        .insert({
          name: 'OSP Other Department',
          address: 'Other Address 456',
          phone: '987-654-3210',
          email: 'other@osp.com',
          county_id: 1
        })
        .select()
        .single();

      expect(otherDeptError).toBeNull();

      // Create incident for other department
      const { data: otherIncident, error: otherIncidentError } = await supabase
        .from('incidents')
        .insert({
          user_id: testUser.id,
          fire_department_id: otherFireDept.id,
          incident_name: 'Other Department Incident',
          description: 'This should not be visible',
          incident_date: '2023-01-01',
          category: 'fire',
          start_time: '2023-01-01T10:00:00Z',
          end_time: '2023-01-01T12:00:00Z'
        })
        .select()
        .single();

      expect(otherIncidentError).toBeNull();

      // Retrieve meldunki for our test user
      const { data: meldunki, error } = await meldunkiService.getUserMeldunki(testUser.id);

      expect(error).toBeNull();
      expect(meldunki).toBeDefined();

      // Verify other department's incident is not included
      const otherDeptMeldunek = meldunki!.find((m: any) => m.title === 'Other Department Incident');
      expect(otherDeptMeldunek).toBeUndefined();

      // Clean up other department
      await supabase
        .from('fire_departments')
        .delete()
        .eq('id', otherFireDept.id);
    });

    it('should handle database constraints', async () => {
      const invalidMeldunekData = {
        title: '', // Empty title should fail
        description: 'Test description',
        location: 'Test Location',
        incident_type: 'fire' as const,
        severity: 'high' as const,
        incident_date: '2023-01-01'
      };

      const { data, error } = await meldunkiService.createMeldunek({
        user_id: testUser.id,
        fire_department_id: testFireDepartment.id,
        ...invalidMeldunekData
      });

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });
  });

  describe('Database Transaction Integrity', () => {
    it('should maintain referential integrity', async () => {
      // Try to create incident with non-existent fire department
      const { data, error } = await supabase
        .from('incidents')
        .insert({
          user_id: testUser.id,
          fire_department_id: 'non-existent-id',
          incident_name: 'Test Incident',
          description: 'Test description',
          incident_date: '2023-01-01',
          category: 'fire'
        })
        .select();

      expect(error).toBeDefined();
      expect(data).toBeNull();
    });

    it('should handle concurrent operations', async () => {
      const meldunekData = {
        title: 'Concurrent Test Incident',
        description: 'Testing concurrent operations',
        location: 'Test Location',
        incident_type: 'fire' as const,
        severity: 'medium' as const,
        incident_date: '2023-01-01'
      };

      // Create multiple incidents concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        meldunkiService.createMeldunek({
          user_id: testUser.id,
          fire_department_id: testFireDepartment.id,
          ...meldunekData,
          title: `Concurrent Test Incident ${i + 1}`
        })
      );

      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(({ data, error }) => {
        expect(error).toBeNull();
        expect(data).toBeDefined();
      });

      // Verify all incidents were created
      const { data: incidents, error } = await supabase
        .from('incidents')
        .select('*')
        .like('incident_name', 'Concurrent Test Incident%');

      expect(error).toBeNull();
      expect(incidents).toHaveLength(5);
    });
  });

  describe('Database Performance', () => {
    it('should handle large result sets efficiently', async () => {
      // Create many incidents
      const incidents = Array.from({ length: 100 }, (_, i) => ({
        user_id: testUser.id,
        fire_department_id: testFireDepartment.id,
        incident_name: `Performance Test Incident ${i + 1}`,
        description: `Performance test incident ${i + 1}`,
        incident_date: '2023-01-01',
        category: 'fire',
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T12:00:00Z'
      }));

      const { error: insertError } = await supabase
        .from('incidents')
        .insert(incidents);

      expect(insertError).toBeNull();

      // Measure retrieval time
      const startTime = Date.now();
      const { data: meldunki, error } = await meldunkiService.getUserMeldunki(testUser.id);
      const endTime = Date.now();

      expect(error).toBeNull();
      expect(meldunki).toBeDefined();
      expect(meldunki!.length).toBeGreaterThanOrEqual(100);

      // Should complete within reasonable time (adjust threshold as needed)
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });
});
