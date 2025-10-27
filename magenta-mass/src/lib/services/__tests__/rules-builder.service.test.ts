import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RulesBuilderService, type RuleConfig, type RulesContentResult } from '../rules-builder.service';

describe('RulesBuilderService', () => {
  let rulesBuilderService: RulesBuilderService;

  beforeEach(() => {
    rulesBuilderService = new RulesBuilderService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('generateRulesContent', () => {
    const baseConfig: RuleConfig = {
      userRole: 'member',
      fireDepartmentId: 'dept-123',
      systemVersion: '1.0.0',
      language: 'pl'
    };

    describe('Kluczowe reguły biznesowe', () => {
      it('should generate system rules when includeSystemRules is true (default)', async () => {
        // Arrange
        const config = { ...baseConfig };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        expect(result.rules).toBeDefined();
        expect(result.rules.length).toBeGreaterThan(0);
        
        const systemRules = result.rules.filter(rule => rule.category === 'system');
        expect(systemRules.length).toBeGreaterThan(0);
        
        // Check specific system rules
        const securityRule = systemRules.find(rule => rule.id === 'sys-001');
        expect(securityRule).toBeDefined();
        expect(securityRule?.title).toBe('Zasady bezpieczeństwa systemu');
        expect(securityRule?.priority).toBe('high');
        expect(securityRule?.applicableRoles).toContain('member');
      });

      it('should exclude system rules when includeSystemRules is false', async () => {
        // Arrange
        const config = { ...baseConfig, includeSystemRules: false };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const systemRules = result.rules.filter(rule => rule.category === 'system');
        expect(systemRules.length).toBe(0);
      });

      it('should generate department rules when includeDepartmentRules is true (default)', async () => {
        // Arrange
        const config = { ...baseConfig };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const departmentRules = result.rules.filter(rule => rule.category === 'department');
        expect(departmentRules.length).toBeGreaterThan(0);
        
        const deptRule = departmentRules[0];
        expect(deptRule.title).toBe('Zasady jednostki OSP');
        expect(deptRule.content).toContain('dept-123');
      });

      it('should exclude department rules when includeDepartmentRules is false', async () => {
        // Arrange
        const config = { ...baseConfig, includeDepartmentRules: false };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const departmentRules = result.rules.filter(rule => rule.category === 'department');
        expect(departmentRules.length).toBe(0);
      });

      it('should generate role-specific rules for admin user', async () => {
        // Arrange
        const config = { ...baseConfig, userRole: 'admin' as const };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const roleRules = result.rules.filter(rule => rule.category === 'role');
        expect(roleRules.length).toBeGreaterThan(0);
        
        const adminRule = roleRules.find(rule => rule.id === 'role-admin-001');
        expect(adminRule).toBeDefined();
        expect(adminRule?.title).toBe('Zarządzanie użytkownikami');
        expect(adminRule?.applicableRoles).toEqual(['admin']);
      });

      it('should generate role-specific rules for commander user', async () => {
        // Arrange
        const config = { ...baseConfig, userRole: 'commander' as const };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const roleRules = result.rules.filter(rule => rule.category === 'role');
        expect(roleRules.length).toBeGreaterThan(0);
        
        const commanderRule = roleRules.find(rule => rule.id === 'role-commander-001');
        expect(commanderRule).toBeDefined();
        expect(commanderRule?.title).toBe('Zatwierdzanie meldunków');
        expect(commanderRule?.applicableRoles).toEqual(['commander']);
      });

      it('should generate role-specific rules for member user', async () => {
        // Arrange
        const config = { ...baseConfig, userRole: 'member' as const };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const roleRules = result.rules.filter(rule => rule.category === 'role');
        expect(roleRules.length).toBeGreaterThan(0);
        
        const memberRule = roleRules.find(rule => rule.id === 'role-member-001');
        expect(memberRule).toBeDefined();
        expect(memberRule?.title).toBe('Tworzenie meldunków');
        expect(memberRule?.applicableRoles).toEqual(['member']);
      });

      it('should process custom rules when provided', async () => {
        // Arrange
        const customRules = [
          'Reguła niestandardowa 1',
          'Reguła niestandardowa 2'
        ];
        const config = { ...baseConfig, customRules };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const customRulesResult = result.rules.filter(rule => rule.category === 'custom');
        expect(customRulesResult.length).toBe(2);
        
        expect(customRulesResult[0].title).toBe('Reguła niestandardowa');
        expect(customRulesResult[0].content).toBe('Reguła niestandardowa 1');
        expect(customRulesResult[0].priority).toBe('low');
        
        expect(customRulesResult[1].content).toBe('Reguła niestandardowa 2');
      });

      it('should filter rules based on user role applicability', async () => {
        // Arrange
        const config = { ...baseConfig, userRole: 'member' as const };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        // All returned rules should be applicable to 'member' role
        result.rules.forEach(rule => {
          expect(rule.applicableRoles).toContain('member');
        });

        // Should not include admin-only rules
        const adminOnlyRules = result.rules.filter(rule => 
          rule.applicableRoles.length === 1 && rule.applicableRoles[0] === 'admin'
        );
        expect(adminOnlyRules.length).toBe(0);
      });

      it('should generate rules in Polish when language is pl', async () => {
        // Arrange
        const config = { ...baseConfig, language: 'pl' as const };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        expect(result.metadata.language).toBe('pl');
        
        const systemRules = result.rules.filter(rule => rule.category === 'system');
        expect(systemRules.length).toBeGreaterThan(0);
        expect(systemRules[0].title).toBe('Zasady bezpieczeństwa systemu');
      });

      it('should generate rules in English when language is en', async () => {
        // Arrange
        const config = { ...baseConfig, language: 'en' as const };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        expect(result.metadata.language).toBe('en');
        
        const systemRules = result.rules.filter(rule => rule.category === 'system');
        expect(systemRules.length).toBeGreaterThan(0);
        expect(systemRules[0].title).toBe('System Security Rules');
      });

      it('should default to Polish when language is not specified', async () => {
        // Arrange
        const config = { ...baseConfig };
        delete config.language;

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        expect(result.metadata.language).toBe('pl');
      });
    });

    describe('Warunki brzegowe', () => {
      it('should handle empty custom rules array', async () => {
        // Arrange
        const config = { ...baseConfig, customRules: [] };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const customRules = result.rules.filter(rule => rule.category === 'custom');
        expect(customRules.length).toBe(0);
      });

      it('should handle undefined custom rules', async () => {
        // Arrange
        const config = { ...baseConfig };
        delete config.customRules;

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const customRules = result.rules.filter(rule => rule.category === 'custom');
        expect(customRules.length).toBe(0);
      });

      it('should handle very long custom rules', async () => {
        // Arrange
        const longRule = 'A'.repeat(10000); // Very long rule
        const config = { ...baseConfig, customRules: [longRule] };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const customRules = result.rules.filter(rule => rule.category === 'custom');
        expect(customRules.length).toBe(1);
        expect(customRules[0].content).toBe(longRule);
      });

      it('should handle special characters in custom rules', async () => {
        // Arrange
        const specialRule = 'Reguła z znakami specjalnymi: !@#$%^&*()_+-=[]{}|;:,.<>?';
        const config = { ...baseConfig, customRules: [specialRule] };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const customRules = result.rules.filter(rule => rule.category === 'custom');
        expect(customRules.length).toBe(1);
        expect(customRules[0].content).toBe(specialRule);
      });

      it('should handle empty fire department ID', async () => {
        // Arrange
        const config = { ...baseConfig, fireDepartmentId: '' };

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Valid fireDepartmentId is required');
      });

      it('should handle very long fire department ID', async () => {
        // Arrange
        const longId = 'dept-' + 'x'.repeat(1000);
        const config = { ...baseConfig, fireDepartmentId: longId };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const departmentRules = result.rules.filter(rule => rule.category === 'department');
        expect(departmentRules.length).toBeGreaterThan(0);
        expect(departmentRules[0].content).toContain(longId);
      });

      it('should handle minimum system version', async () => {
        // Arrange
        const config = { ...baseConfig, systemVersion: '0.0.1' };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        expect(result.metadata.version).toBe('0.0.1');
      });

      it('should handle maximum system version', async () => {
        // Arrange
        const config = { ...baseConfig, systemVersion: '999.999.999' };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        expect(result.metadata.version).toBe('999.999.999');
      });
    });

    describe('Walidacja danych wejściowych', () => {
      it('should throw error when config is null', async () => {
        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(null as any))
          .rejects.toThrow('Configuration is required');
      });

      it('should throw error when config is undefined', async () => {
        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(undefined as any))
          .rejects.toThrow('Configuration is required');
      });

      it('should throw error when userRole is invalid', async () => {
        // Arrange
        const config = { ...baseConfig, userRole: 'invalid-role' as any };

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Valid userRole is required (admin, commander, or member)');
      });

      it('should throw error when userRole is missing', async () => {
        // Arrange
        const config = { ...baseConfig };
        delete config.userRole;

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Valid userRole is required (admin, commander, or member)');
      });

      it('should throw error when fireDepartmentId is null', async () => {
        // Arrange
        const config = { ...baseConfig, fireDepartmentId: null as any };

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Valid fireDepartmentId is required');
      });

      it('should throw error when fireDepartmentId is not a string', async () => {
        // Arrange
        const config = { ...baseConfig, fireDepartmentId: 123 as any };

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Valid fireDepartmentId is required');
      });

      it('should throw error when systemVersion is missing', async () => {
        // Arrange
        const config = { ...baseConfig };
        delete config.systemVersion;

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Valid systemVersion is required');
      });

      it('should throw error when systemVersion is not a string', async () => {
        // Arrange
        const config = { ...baseConfig, systemVersion: 1.0 as any };

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Valid systemVersion is required');
      });

      it('should throw error when language is invalid', async () => {
        // Arrange
        const config = { ...baseConfig, language: 'invalid-lang' as any };

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Language must be either "pl" or "en"');
      });

      it('should throw error when customRules is not an array', async () => {
        // Arrange
        const config = { ...baseConfig, customRules: 'not-an-array' as any };

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Custom rules must be an array');
      });
    });

    describe('Obsługa błędów i wyjątków', () => {
      it('should handle database connection errors gracefully', async () => {
        // Arrange
        const config = { ...baseConfig };
        
        // Mock the getDepartmentRules method to throw an error
        const originalGetDepartmentRules = (rulesBuilderService as any).getDepartmentRules;
        vi.spyOn(rulesBuilderService as any, 'getDepartmentRules')
          .mockRejectedValueOnce(new Error('Database connection failed'));

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Failed to generate rules content: Database connection failed');
      });

      it('should handle unexpected errors during rule generation', async () => {
        // Arrange
        const config = { ...baseConfig };
        
        // Mock the getSystemRules method to throw an error
        vi.spyOn(rulesBuilderService as any, 'getSystemRules')
          .mockImplementationOnce(() => {
            throw new Error('Unexpected system error');
          });

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Failed to generate rules content: Unexpected system error');
      });

      it('should handle errors in custom rules processing', async () => {
        // Arrange
        const config = { ...baseConfig, customRules: ['rule1', 'rule2'] };
        
        // Mock the processCustomRules method to throw an error
        vi.spyOn(rulesBuilderService as any, 'processCustomRules')
          .mockImplementationOnce(() => {
            throw new Error('Custom rules processing failed');
          });

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Failed to generate rules content: Custom rules processing failed');
      });

      it('should handle errors in metadata generation', async () => {
        // Arrange
        const config = { ...baseConfig };
        
        // Mock the generateMetadata method to throw an error
        vi.spyOn(rulesBuilderService as any, 'generateMetadata')
          .mockImplementationOnce(() => {
            throw new Error('Metadata generation failed');
          });

        // Act & Assert
        await expect(rulesBuilderService.generateRulesContent(config))
          .rejects.toThrow('Failed to generate rules content: Metadata generation failed');
      });
    });

    describe('Metadane i struktura odpowiedzi', () => {
      it('should generate correct metadata structure', async () => {
        // Arrange
        const config = { ...baseConfig };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        expect(result.metadata).toBeDefined();
        expect(result.metadata.generatedAt).toBeDefined();
        expect(result.metadata.totalRules).toBeGreaterThan(0);
        expect(result.metadata.categories).toBeDefined();
        expect(result.metadata.language).toBe('pl');
        expect(result.metadata.version).toBe('1.0.0');
        
        // Check if generatedAt is a valid ISO string
        expect(new Date(result.metadata.generatedAt).toISOString()).toBe(result.metadata.generatedAt);
      });

      it('should count rules by category correctly', async () => {
        // Arrange
        const config = { ...baseConfig };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const expectedCategories = ['system', 'department', 'role'];
        expectedCategories.forEach(category => {
          expect(result.metadata.categories[category]).toBeGreaterThan(0);
        });
        
        // Verify counts match actual rules
        const actualCounts = result.rules.reduce((acc, rule) => {
          acc[rule.category] = (acc[rule.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        expect(result.metadata.categories).toEqual(actualCounts);
      });

      it('should generate unique rule IDs', async () => {
        // Arrange
        const config = { ...baseConfig, customRules: ['rule1', 'rule2', 'rule3'] };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const ruleIds = result.rules.map(rule => rule.id);
        const uniqueIds = new Set(ruleIds);
        expect(ruleIds.length).toBe(uniqueIds.size);
      });

      it('should include all required rule properties', async () => {
        // Arrange
        const config = { ...baseConfig };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        result.rules.forEach(rule => {
          expect(rule.id).toBeDefined();
          expect(rule.title).toBeDefined();
          expect(rule.content).toBeDefined();
          expect(rule.category).toBeDefined();
          expect(rule.priority).toBeDefined();
          expect(rule.applicableRoles).toBeDefined();
          expect(Array.isArray(rule.applicableRoles)).toBe(true);
        });
      });

      it('should have consistent priority values', async () => {
        // Arrange
        const config = { ...baseConfig };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const validPriorities = ['high', 'medium', 'low'];
        result.rules.forEach(rule => {
          expect(validPriorities).toContain(rule.priority);
        });
      });

      it('should have consistent category values', async () => {
        // Arrange
        const config = { ...baseConfig };

        // Act
        const result = await rulesBuilderService.generateRulesContent(config);

        // Assert
        const validCategories = ['system', 'department', 'role', 'custom'];
        result.rules.forEach(rule => {
          expect(validCategories).toContain(rule.category);
        });
      });
    });

    describe('Wydajność i optymalizacja', () => {
      it('should complete within reasonable time for large custom rules set', async () => {
        // Arrange
        const largeCustomRules = Array.from({ length: 1000 }, (_, i) => `Custom rule ${i}`);
        const config = { ...baseConfig, customRules: largeCustomRules };

        // Act
        const startTime = Date.now();
        const result = await rulesBuilderService.generateRulesContent(config);
        const endTime = Date.now();

        // Assert
        expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
        expect(result.rules.length).toBeGreaterThan(1000);
      });

      it('should handle concurrent requests without issues', async () => {
        // Arrange
        const configs = Array.from({ length: 10 }, (_, i) => ({
          ...baseConfig,
          fireDepartmentId: `dept-${i}`,
          customRules: [`Rule ${i}`]
        }));

        // Act
        const promises = configs.map(config => 
          rulesBuilderService.generateRulesContent(config)
        );
        const results = await Promise.all(promises);

        // Assert
        expect(results).toHaveLength(10);
        results.forEach((result, index) => {
          expect(result.rules.length).toBeGreaterThan(0);
          expect(result.metadata.totalRules).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Metody pomocnicze', () => {
    describe('getAvailableCategories', () => {
      it('should return all available rule categories', () => {
        // Act
        const categories = rulesBuilderService.getAvailableCategories();

        // Assert
        expect(categories).toEqual(['system', 'department', 'role', 'custom']);
        expect(categories).toHaveLength(4);
      });
    });

    describe('getAvailableRoles', () => {
      it('should return all available user roles', () => {
        // Act
        const roles = rulesBuilderService.getAvailableRoles();

        // Assert
        expect(roles).toEqual(['admin', 'commander', 'member']);
        expect(roles).toHaveLength(3);
      });
    });

    describe('getAvailableLanguages', () => {
      it('should return all available languages', () => {
        // Act
        const languages = rulesBuilderService.getAvailableLanguages();

        // Assert
        expect(languages).toEqual(['pl', 'en']);
        expect(languages).toHaveLength(2);
      });
    });
  });
});
