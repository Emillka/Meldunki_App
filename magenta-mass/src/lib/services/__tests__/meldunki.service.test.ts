import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MeldunkiService } from '../meldunki.service';
import { mockSupabaseClient, testData, setupTestEnvironment, cleanupTestEnvironment } from '../../../test/utils';
import type { CreateMeldunekCommand } from '../../types';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient)
}));

describe('MeldunkiService', () => {
  let meldunkiService: MeldunkiService;

  beforeEach(() => {
    setupTestEnvironment();
    meldunkiService = new MeldunkiService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanupTestEnvironment();
  });

  describe('createMeldunek', () => {
    it('should successfully create a meldunek with valid data', async () => {
      // Arrange
      const command: CreateMeldunekCommand = {
        user_id: testData.user.id,
        fire_department_id: testData.fireDepartment.id,
        title: 'Pożar budynku',
        description: 'Opis zdarzenia pożarowego',
        location: 'ul. Główna 1, Warszawa',
        incident_type: 'fire',
        incident_date: '2024-01-15',
        duration_minutes: 120,
        equipment_used: ['wóz strażacki', 'drabina'],
        severity: 'high',
      };

      // Mock profile access validation
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { fire_department_id: testData.fireDepartment.id },
          error: null
        })
      });

      // Mock successful meldunek creation
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: {
            id: 'meldunek-id',
            user_id: command.user_id,
            fire_department_id: command.fire_department_id,
            incident_name: command.title,
            description: command.description,
            location_address: command.location,
            incident_date: command.incident_date,
            start_time: new Date().toISOString(),
            end_time: new Date(Date.now() + command.duration_minutes! * 60000).toISOString(),
            category: command.incident_type,
            summary: command.additional_notes,
            forces_and_resources: command.equipment_used?.join(', '),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          error: null
        })
      });

      // Act
      const result = await meldunkiService.createMeldunek(command);

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data?.meldunek).toBeDefined();
      expect(result.data?.meldunek.title).toBe(command.title);
      expect(result.data?.meldunek.description).toBe(command.description);
      expect(result.data?.meldunek.location).toBe(command.location);
      expect(result.data?.message).toBe('Meldunek został pomyślnie utworzony');
    });

    it('should return error when user does not have access to fire department', async () => {
      // Arrange
      const command: CreateMeldunekCommand = {
        user_id: testData.user.id,
        fire_department_id: 'different-department-id',
        title: 'Pożar budynku',
        description: 'Opis zdarzenia',
        location: 'ul. Główna 1',
        incident_type: 'fire',
        incident_date: '2024-01-15'
      };

      // Mock profile access validation - different department
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { fire_department_id: testData.fireDepartment.id },
          error: null
        })
      });

      // Act
      const result = await meldunkiService.createMeldunek(command);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('FIRE_DEPARTMENT_ACCESS_DENIED');
    });

    it('should return error when profile is not found', async () => {
      // Arrange
      const command: CreateMeldunekCommand = {
        user_id: 'non-existent-user',
        fire_department_id: testData.fireDepartment.id,
        title: 'Pożar budynku',
        description: 'Opis zdarzenia',
        location: 'ul. Główna 1',
        incident_type: 'fire',
        incident_date: '2024-01-15'
      };

      // Mock profile not found
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Profile not found' }
        })
      });

      // Act
      const result = await meldunkiService.createMeldunek(command);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Profile not found');
    });

    it('should handle database insertion errors', async () => {
      // Arrange
      const command: CreateMeldunekCommand = {
        user_id: testData.user.id,
        fire_department_id: testData.fireDepartment.id,
        title: 'Pożar budynku',
        description: 'Opis zdarzenia',
        location: 'ul. Główna 1',
        incident_type: 'fire',
        incident_date: '2024-01-15'
      };

      // Mock profile access validation
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: { fire_department_id: testData.fireDepartment.id },
          error: null
        })
      });

      // Mock database insertion error
      mockSupabaseClient.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database constraint violation' }
        })
      });

      // Act
      const result = await meldunkiService.createMeldunek(command);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database constraint violation');
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const command: CreateMeldunekCommand = {
        user_id: testData.user.id,
        fire_department_id: testData.fireDepartment.id,
        title: 'Pożar budynku',
        description: 'Opis zdarzenia',
        location: 'ul. Główna 1',
        incident_type: 'fire',
        incident_date: '2024-01-15'
      };

      // Mock unexpected error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      // Act
      const result = await meldunkiService.createMeldunek(command);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Network error');
    });
  });

  describe('getUserMeldunki', () => {
    it('should successfully fetch user meldunki', async () => {
      // Arrange
      const userId = testData.user.id;
      const mockIncidents = [
        {
          id: 'incident-1',
          user_id: userId,
          fire_department_id: testData.fireDepartment.id,
          incident_name: 'Pożar budynku',
          description: 'Opis zdarzenia',
          location_address: 'ul. Główna 1',
          incident_date: '2024-01-15',
          start_time: '2024-01-15T10:00:00Z',
          end_time: '2024-01-15T12:00:00Z',
          category: 'fire',
          summary: 'Dodatkowe informacje',
          forces_and_resources: 'wóz strażacki, drabina',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ];

      // Mock successful fetch
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockIncidents,
          error: null
        })
      });

      // Act
      const result = await meldunkiService.getUserMeldunki(userId);

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(1);
      expect(result.data![0].title).toBe('Pożar budynku');
      expect(result.data![0].duration_minutes).toBe(120);
      expect(result.data![0].equipment_used).toEqual(['wóz strażacki', 'drabina']);
    });

    it('should return empty array when no meldunki found', async () => {
      // Arrange
      const userId = testData.user.id;

      // Mock empty result
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      // Act
      const result = await meldunkiService.getUserMeldunki(userId);

      // Assert
      expect(result.error).toBeNull();
      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(0);
    });

    it('should handle database fetch errors', async () => {
      // Arrange
      const userId = testData.user.id;

      // Mock database error
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database connection failed' }
        })
      });

      // Act
      const result = await meldunkiService.getUserMeldunki(userId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Database connection failed');
    });

    it('should respect limit parameter', async () => {
      // Arrange
      const userId = testData.user.id;
      const limit = 10;

      // Mock successful fetch
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      // Act
      await meldunkiService.getUserMeldunki(userId, limit);

      // Assert
      expect(mockSupabaseClient.from().limit).toHaveBeenCalledWith(limit);
    });

    it('should handle unexpected errors gracefully', async () => {
      // Arrange
      const userId = testData.user.id;

      // Mock unexpected error
      mockSupabaseClient.from.mockImplementation(() => {
        throw new Error('Network error');
      });

      // Act
      const result = await meldunkiService.getUserMeldunki(userId);

      // Assert
      expect(result.data).toBeNull();
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Network error');
    });
  });
});
