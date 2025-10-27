import { describe, it, expect } from 'vitest';
import {
  validateCreateMeldunekRequest,
  sanitizeString,
  validateDate,
  validateEquipmentList
} from '../meldunki.validation';
import type { CreateMeldunekRequestDTO } from '../../types';

describe('meldunki.validation', () => {
  describe('validateCreateMeldunekRequest', () => {
    it('should validate valid meldunek data', () => {
      // Arrange
      const today = new Date();
      const incidentDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      const validData: CreateMeldunekRequestDTO = {
        title: 'Pożar budynku mieszkalnego',
        description: 'Pożar wybuchł w budynku mieszkalnym na ul. Głównej. Akcja trwała 2 godziny.',
        location: 'ul. Główna 15, Warszawa',
        incident_type: 'fire',
        severity: 'high',
        incident_date: incidentDate.toISOString().split('T')[0],
        duration_minutes: 120,
        participants_count: 8,
        equipment_used: ['wóz strażacki', 'drabina', 'wąż'],
        weather_conditions: 'Słoneczna pogoda, temperatura 15°C',
        additional_notes: 'Brak ofiar, straty materialne oszacowane na 50 000 zł'
      };

      // Act
      const result = validateCreateMeldunekRequest(validData);

      // Assert
      expect(result.valid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });

    it('should reject invalid request data', () => {
      // Arrange
      const invalidData = null;

      // Act
      const result = validateCreateMeldunekRequest(invalidData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.general).toBe('Invalid request data');
    });

    it('should reject non-object data', () => {
      // Arrange
      const invalidData = 'not an object';

      // Act
      const result = validateCreateMeldunekRequest(invalidData);

      // Assert
      expect(result.valid).toBe(false);
      expect(result.errors.general).toBe('Invalid request data');
    });

    describe('title validation', () => {
      it('should require title', () => {
        const data = {
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.title).toBe('Tytuł jest wymagany');
      });

      it('should reject title shorter than 3 characters', () => {
        const data = {
          title: 'Po',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.title).toBe('Tytuł musi mieć co najmniej 3 znaki');
      });

      it('should reject title longer than 100 characters', () => {
        const data = {
          title: 'a'.repeat(101),
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.title).toBe('Tytuł nie może mieć więcej niż 100 znaków');
      });
    });

    describe('description validation', () => {
      it('should require description', () => {
        const data = {
          title: 'Valid title',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.description).toBe('Opis jest wymagany');
      });

      it('should reject description shorter than 10 characters', () => {
        const data = {
          title: 'Valid title',
          description: 'Short',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.description).toBe('Opis musi mieć co najmniej 10 znaków');
      });

      it('should reject description longer than 1000 characters', () => {
        const data = {
          title: 'Valid title',
          description: 'a'.repeat(1001),
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.description).toBe('Opis nie może mieć więcej niż 1000 znaków');
      });
    });

    describe('location validation', () => {
      it('should require location', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.location).toBe('Lokalizacja jest wymagana');
      });

      it('should reject location shorter than 3 characters', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'ul',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.location).toBe('Lokalizacja musi mieć co najmniej 3 znaki');
      });

      it('should reject location longer than 200 characters', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'a'.repeat(201),
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.location).toBe('Lokalizacja nie może mieć więcej niż 200 znaków');
      });
    });

    describe('incident_type validation', () => {
      it('should require incident_type', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.incident_type).toBe('Typ zdarzenia jest wymagany');
      });

      it('should accept valid incident types', () => {
        const validTypes = ['fire', 'rescue', 'medical', 'other'];
        const today = new Date();
        const incidentDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        validTypes.forEach(type => {
          const data = {
            title: 'Valid title',
            description: 'Valid description',
            location: 'Valid location',
            incident_type: type,
            severity: 'medium',
            incident_date: incidentDate.toISOString().split('T')[0]
          };
          const result = validateCreateMeldunekRequest(data);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid incident type', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'invalid-type',
          severity: 'medium',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.incident_type).toBe('Nieprawidłowy typ zdarzenia');
      });
    });

    describe('severity validation', () => {
      it('should require severity', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.severity).toBe('Poziom zagrożenia jest wymagany');
      });

      it('should accept valid severity levels', () => {
        const validSeverities = ['low', 'medium', 'high', 'critical'];
        const today = new Date();
        const incidentDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        
        validSeverities.forEach(severity => {
          const data = {
            title: 'Valid title',
            description: 'Valid description',
            location: 'Valid location',
            incident_type: 'fire',
            severity: severity,
            incident_date: incidentDate.toISOString().split('T')[0]
          };
          const result = validateCreateMeldunekRequest(data);
          expect(result.valid).toBe(true);
        });
      });

      it('should reject invalid severity', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'invalid-severity',
          incident_date: '2024-01-15'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.severity).toBe('Nieprawidłowy poziom zagrożenia');
      });
    });

    describe('incident_date validation', () => {
      it('should require incident_date', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.incident_date).toBe('Data zdarzenia jest wymagana');
      });

      it('should reject invalid date format', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: 'invalid-date'
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.incident_date).toBe('Nieprawidłowy format daty');
      });

      it('should reject future dates', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const futureDateString = futureDate.toISOString().split('T')[0];

        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: futureDateString
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.incident_date).toBe('Data zdarzenia nie może być w przyszłości');
      });

      it('should reject dates older than one year', () => {
        const oldDate = new Date();
        oldDate.setFullYear(oldDate.getFullYear() - 2);
        const oldDateString = oldDate.toISOString().split('T')[0];

        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: oldDateString
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.incident_date).toBe('Data zdarzenia nie może być starsza niż rok');
      });
    });

    describe('optional fields validation', () => {
      it('should validate duration_minutes', () => {
        // Test negative duration
        const data1 = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          duration_minutes: -10
        };
        const result1 = validateCreateMeldunekRequest(data1);
        expect(result1.valid).toBe(false);
        expect(result1.errors.duration_minutes).toBe('Czas trwania musi być liczbą nieujemną');

        // Test duration longer than 24 hours
        const data2 = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          duration_minutes: 1500 // 25 hours
        };
        const result2 = validateCreateMeldunekRequest(data2);
        expect(result2.valid).toBe(false);
        expect(result2.errors.duration_minutes).toBe('Czas trwania nie może być dłuższy niż 24 godziny');
      });

      it('should validate participants_count', () => {
        // Test negative count
        const data1 = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          participants_count: -5
        };
        const result1 = validateCreateMeldunekRequest(data1);
        expect(result1.valid).toBe(false);
        expect(result1.errors.participants_count).toBe('Liczba uczestników musi być liczbą nieujemną');

        // Test count greater than 100
        const data2 = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          participants_count: 150
        };
        const result2 = validateCreateMeldunekRequest(data2);
        expect(result2.valid).toBe(false);
        expect(result2.errors.participants_count).toBe('Liczba uczestników nie może być większa niż 100');
      });

      it('should validate equipment_used', () => {
        // Test non-array equipment
        const data1 = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          equipment_used: 'not an array'
        };
        const result1 = validateCreateMeldunekRequest(data1);
        expect(result1.valid).toBe(false);
        expect(result1.errors.equipment_used).toBe('Sprzęt musi być listą');

        // Test too many equipment items
        const data2 = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          equipment_used: Array(25).fill('equipment')
        };
        const result2 = validateCreateMeldunekRequest(data2);
        expect(result2.valid).toBe(false);
        expect(result2.errors.equipment_used).toBe('Nie można dodać więcej niż 20 pozycji sprzętu');

        // Test empty equipment item
        const data3 = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          equipment_used: ['valid equipment', '']
        };
        const result3 = validateCreateMeldunekRequest(data3);
        expect(result3.valid).toBe(false);
        expect(result3.errors.equipment_used_1).toBe('Pozycja sprzętu nie może być pusta');
      });

      it('should validate weather_conditions', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          weather_conditions: 'a'.repeat(201)
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.weather_conditions).toBe('Warunki pogodowe nie mogą mieć więcej niż 200 znaków');
      });

      it('should validate additional_notes', () => {
        const data = {
          title: 'Valid title',
          description: 'Valid description',
          location: 'Valid location',
          incident_type: 'fire',
          severity: 'medium',
          incident_date: '2024-01-15',
          additional_notes: 'a'.repeat(501)
        };
        const result = validateCreateMeldunekRequest(data);
        expect(result.valid).toBe(false);
        expect(result.errors.additional_notes).toBe('Dodatkowe uwagi nie mogą mieć więcej niż 500 znaków');
      });
    });
  });

  describe('sanitizeString', () => {
    it('should sanitize strings with HTML tags', () => {
      const input = 'Test <script>alert(1)</script> content';
      const result = sanitizeString(input);
      expect(result).toBe('Test scriptalert(1)/script content');
    });

    it('should remove javascript: protocol', () => {
      const input = 'javascript:alert(1)';
      const result = sanitizeString(input);
      expect(result).toBe('alert(1)');
    });

    it('should trim whitespace', () => {
      const input = '  Test String  ';
      const result = sanitizeString(input);
      expect(result).toBe('Test String');
    });

    it('should limit string length to 1000 characters', () => {
      const longInput = 'a'.repeat(1200);
      const result = sanitizeString(longInput);
      expect(result).toHaveLength(1000);
      expect(result).toBe('a'.repeat(1000));
    });

    it('should handle null input', () => {
      const result = sanitizeString(null);
      expect(result).toBeNull();
    });

    it('should handle undefined input', () => {
      const result = sanitizeString(undefined);
      expect(result).toBeNull();
    });

    it('should handle non-string input', () => {
      const result = sanitizeString(123 as any);
      expect(result).toBeNull();
    });
  });

  describe('validateDate', () => {
    it('should validate correct ISO date format', () => {
      const validDates = [
        '2024-01-15',
        '2023-12-31',
        '2024-02-29' // Leap year
      ];

      validDates.forEach(date => {
        expect(validateDate(date)).toBe(true);
      });
    });

    it('should reject invalid date formats', () => {
      const invalidDates = [
        '2024-13-01', // Invalid month
        '2024-01-32', // Invalid day
        '2024/01/15', // Wrong separator
        '15-01-2024', // Wrong order
        '2024-1-15',  // Missing leading zero
        'invalid-date',
        '',
        '2024-01-15T10:00:00Z' // ISO datetime
      ];

      invalidDates.forEach(date => {
        expect(validateDate(date)).toBe(false);
      });
    });
  });

  describe('validateEquipmentList', () => {
    it('should validate correct equipment lists', () => {
      const validLists = [
        ['wóz strażacki', 'drabina'],
        ['sprzęt'],
        []
      ];

      validLists.forEach(list => {
        expect(validateEquipmentList(list)).toBe(true);
      });
    });

    it('should reject non-array input', () => {
      const invalidInputs = [
        'not an array',
        123,
        null,
        undefined,
        {}
      ];

      invalidInputs.forEach(input => {
        expect(validateEquipmentList(input)).toBe(false);
      });
    });

    it('should reject arrays with invalid items', () => {
      const invalidLists = [
        ['valid item', ''], // Empty string
        ['valid item', 'a'.repeat(101)], // Too long
        ['valid item', 123], // Non-string
        [''] // Empty string
      ];

      invalidLists.forEach(list => {
        expect(validateEquipmentList(list)).toBe(false);
      });
    });
  });
});
