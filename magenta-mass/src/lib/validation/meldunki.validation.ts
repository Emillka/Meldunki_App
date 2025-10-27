import type { CreateMeldunekRequestDTO } from '../types';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

/**
 * Waliduje dane formularza nowego meldunku
 * 
 * @param data - Dane z formularza
 * @returns Wynik walidacji z błędami
 */
export function validateCreateMeldunekRequest(data: unknown): ValidationResult {
  const errors: Record<string, string> = {};
  
  if (!data || typeof data !== 'object') {
    return {
      valid: false,
      errors: { general: 'Invalid request data' }
    };
  }
  
  const {
    title,
    description,
    location,
    incident_type,
    severity,
    incident_date,
    duration_minutes,
    participants_count,
    equipment_used,
    weather_conditions,
    additional_notes
  } = data as Record<string, unknown>;
  
  // Title validation
  if (!title || typeof title !== 'string') {
    errors.title = 'Tytuł jest wymagany';
  } else if (title.trim().length < 3) {
    errors.title = 'Tytuł musi mieć co najmniej 3 znaki';
  } else if (title.trim().length > 100) {
    errors.title = 'Tytuł nie może mieć więcej niż 100 znaków';
  }
  
  // Description validation
  if (!description || typeof description !== 'string') {
    errors.description = 'Opis jest wymagany';
  } else if (description.trim().length < 10) {
    errors.description = 'Opis musi mieć co najmniej 10 znaków';
  } else if (description.trim().length > 1000) {
    errors.description = 'Opis nie może mieć więcej niż 1000 znaków';
  }
  
  // Location validation
  if (!location || typeof location !== 'string') {
    errors.location = 'Lokalizacja jest wymagana';
  } else if (location.trim().length < 3) {
    errors.location = 'Lokalizacja musi mieć co najmniej 3 znaki';
  } else if (location.trim().length > 200) {
    errors.location = 'Lokalizacja nie może mieć więcej niż 200 znaków';
  }
  
  // Incident type validation
  if (!incident_type || typeof incident_type !== 'string') {
    errors.incident_type = 'Typ zdarzenia jest wymagany';
  } else if (!['fire', 'rescue', 'medical', 'other'].includes(incident_type)) {
    errors.incident_type = 'Nieprawidłowy typ zdarzenia';
  }
  
  // Severity validation
  if (!severity || typeof severity !== 'string') {
    errors.severity = 'Poziom zagrożenia jest wymagany';
  } else if (!['low', 'medium', 'high', 'critical'].includes(severity)) {
    errors.severity = 'Nieprawidłowy poziom zagrożenia';
  }
  
  // Incident date validation
  if (!incident_date || typeof incident_date !== 'string') {
    errors.incident_date = 'Data zdarzenia jest wymagana';
  } else {
    const date = new Date(incident_date);
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    if (isNaN(date.getTime())) {
      errors.incident_date = 'Nieprawidłowy format daty';
    } else if (date > now) {
      errors.incident_date = 'Data zdarzenia nie może być w przyszłości';
    } else if (date < oneYearAgo) {
      errors.incident_date = 'Data zdarzenia nie może być starsza niż rok';
    }
  }
  
  // Duration validation (optional)
  if (duration_minutes !== undefined && duration_minutes !== null) {
    if (typeof duration_minutes !== 'number' || duration_minutes < 0) {
      errors.duration_minutes = 'Czas trwania musi być liczbą nieujemną';
    } else if (duration_minutes > 1440) { // 24 hours
      errors.duration_minutes = 'Czas trwania nie może być dłuższy niż 24 godziny';
    }
  }
  
  // Participants count validation (optional)
  if (participants_count !== undefined && participants_count !== null) {
    if (typeof participants_count !== 'number' || participants_count < 0) {
      errors.participants_count = 'Liczba uczestników musi być liczbą nieujemną';
    } else if (participants_count > 100) {
      errors.participants_count = 'Liczba uczestników nie może być większa niż 100';
    }
  }
  
  // Equipment used validation (optional)
  if (equipment_used !== undefined && equipment_used !== null) {
    if (!Array.isArray(equipment_used)) {
      errors.equipment_used = 'Sprzęt musi być listą';
    } else if (equipment_used.length > 20) {
      errors.equipment_used = 'Nie można dodać więcej niż 20 pozycji sprzętu';
    } else {
      equipment_used.forEach((item, index) => {
        if (typeof item !== 'string' || item.trim().length === 0) {
          errors[`equipment_used_${index}`] = 'Pozycja sprzętu nie może być pusta';
        } else if (item.trim().length > 100) {
          errors[`equipment_used_${index}`] = 'Pozycja sprzętu nie może mieć więcej niż 100 znaków';
        }
      });
    }
  }
  
  // Weather conditions validation (optional)
  if (weather_conditions !== undefined && weather_conditions !== null) {
    if (typeof weather_conditions !== 'string') {
      errors.weather_conditions = 'Warunki pogodowe muszą być tekstem';
    } else if (weather_conditions.trim().length > 200) {
      errors.weather_conditions = 'Warunki pogodowe nie mogą mieć więcej niż 200 znaków';
    }
  }
  
  // Additional notes validation (optional)
  if (additional_notes !== undefined && additional_notes !== null) {
    if (typeof additional_notes !== 'string') {
      errors.additional_notes = 'Dodatkowe uwagi muszą być tekstem';
    } else if (additional_notes.trim().length > 500) {
      errors.additional_notes = 'Dodatkowe uwagi nie mogą mieć więcej niż 500 znaków';
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Sanityzuje string - usuwa potencjalnie niebezpieczne znaki
 * 
 * @param input - String do sanityzacji
 * @returns Sanityzowany string lub null
 */
export function sanitizeString(input: string | null | undefined): string | null {
  if (!input || typeof input !== 'string') {
    return null;
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .substring(0, 1000); // Limit length
}

/**
 * Waliduje datę w formacie ISO
 * 
 * @param dateString - String z datą
 * @returns true jeśli data jest prawidłowa
 */
export function validateDate(dateString: string): boolean {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString().split('T')[0];
}

/**
 * Waliduje listę sprzętu
 * 
 * @param equipment - Lista sprzętu
 * @returns true jeśli lista jest prawidłowa
 */
export function validateEquipmentList(equipment: unknown): boolean {
  if (!Array.isArray(equipment)) {
    return false;
  }
  
  return equipment.every(item => 
    typeof item === 'string' && 
    item.trim().length > 0 && 
    item.trim().length <= 100
  );
}
