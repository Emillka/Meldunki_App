/**
 * RulesBuilderService - Service responsible for generating business rules content
 * for the FireLog system based on user roles, fire department policies, and system configuration.
 */

export interface RuleConfig {
  userRole: 'admin' | 'commander' | 'member';
  fireDepartmentId: string;
  systemVersion: string;
  customRules?: string[];
  includeSystemRules?: boolean;
  includeDepartmentRules?: boolean;
  language?: 'pl' | 'en';
}

export interface GeneratedRule {
  id: string;
  title: string;
  content: string;
  category: 'system' | 'department' | 'role' | 'custom';
  priority: 'high' | 'medium' | 'low';
  applicableRoles: string[];
  effectiveDate?: string;
  expirationDate?: string;
}

export interface RulesContentResult {
  rules: GeneratedRule[];
  metadata: {
    generatedAt: string;
    totalRules: number;
    categories: Record<string, number>;
    language: string;
    version: string;
  };
}

export class RulesBuilderService {
  private readonly systemRules: Record<string, GeneratedRule[]> = {
    pl: [
      {
        id: 'sys-001',
        title: 'Zasady bezpieczeństwa systemu',
        content: 'Wszyscy użytkownicy muszą przestrzegać zasad bezpieczeństwa podczas korzystania z systemu FireLog.',
        category: 'system',
        priority: 'high',
        applicableRoles: ['admin', 'commander', 'member']
      },
      {
        id: 'sys-002',
        title: 'Ochrona danych osobowych',
        content: 'Dane osobowe użytkowników są chronione zgodnie z RODO. Zabrania się udostępniania danych osobom nieupoważnionym.',
        category: 'system',
        priority: 'high',
        applicableRoles: ['admin', 'commander', 'member']
      },
      {
        id: 'sys-003',
        title: 'Dostęp do systemu',
        content: 'Każdy użytkownik może mieć tylko jedno aktywne konto w systemie.',
        category: 'system',
        priority: 'medium',
        applicableRoles: ['admin', 'commander', 'member']
      }
    ],
    en: [
      {
        id: 'sys-001',
        title: 'System Security Rules',
        content: 'All users must follow security rules when using the FireLog system.',
        category: 'system',
        priority: 'high',
        applicableRoles: ['admin', 'commander', 'member']
      },
      {
        id: 'sys-002',
        title: 'Personal Data Protection',
        content: 'User personal data is protected according to GDPR. Sharing data with unauthorized persons is prohibited.',
        category: 'system',
        priority: 'high',
        applicableRoles: ['admin', 'commander', 'member']
      },
      {
        id: 'sys-003',
        title: 'System Access',
        content: 'Each user can have only one active account in the system.',
        category: 'system',
        priority: 'medium',
        applicableRoles: ['admin', 'commander', 'member']
      }
    ]
  };

  private readonly roleRules: Record<string, Record<string, GeneratedRule[]>> = {
    pl: {
      admin: [
        {
          id: 'role-admin-001',
          title: 'Zarządzanie użytkownikami',
          content: 'Administrator może tworzyć, edytować i usuwać konta użytkowników w swojej jednostce OSP.',
          category: 'role',
          priority: 'high',
          applicableRoles: ['admin']
        },
        {
          id: 'role-admin-002',
          title: 'Zarządzanie meldunkami',
          content: 'Administrator ma pełny dostęp do wszystkich meldunków w jednostce OSP.',
          category: 'role',
          priority: 'high',
          applicableRoles: ['admin']
        }
      ],
      commander: [
        {
          id: 'role-commander-001',
          title: 'Zatwierdzanie meldunków',
          content: 'Dowódca może zatwierdzać i edytować meldunki w swojej jednostce OSP.',
          category: 'role',
          priority: 'high',
          applicableRoles: ['commander']
        },
        {
          id: 'role-commander-002',
          title: 'Raportowanie',
          content: 'Dowódca odpowiada za raportowanie do wyższych instancji.',
          category: 'role',
          priority: 'medium',
          applicableRoles: ['commander']
        }
      ],
      member: [
        {
          id: 'role-member-001',
          title: 'Tworzenie meldunków',
          content: 'Członek może tworzyć i edytować własne meldunki.',
          category: 'role',
          priority: 'medium',
          applicableRoles: ['member']
        },
        {
          id: 'role-member-002',
          title: 'Przestrzeganie procedur',
          content: 'Członek musi przestrzegać wszystkich procedur bezpieczeństwa.',
          category: 'role',
          priority: 'high',
          applicableRoles: ['member']
        }
      ]
    },
    en: {
      admin: [
        {
          id: 'role-admin-001',
          title: 'User Management',
          content: 'Administrator can create, edit and delete user accounts in their fire department.',
          category: 'role',
          priority: 'high',
          applicableRoles: ['admin']
        },
        {
          id: 'role-admin-002',
          title: 'Report Management',
          content: 'Administrator has full access to all reports in the fire department.',
          category: 'role',
          priority: 'high',
          applicableRoles: ['admin']
        }
      ],
      commander: [
        {
          id: 'role-commander-001',
          title: 'Report Approval',
          content: 'Commander can approve and edit reports in their fire department.',
          category: 'role',
          priority: 'high',
          applicableRoles: ['commander']
        },
        {
          id: 'role-commander-002',
          title: 'Reporting',
          content: 'Commander is responsible for reporting to higher authorities.',
          category: 'role',
          priority: 'medium',
          applicableRoles: ['commander']
        }
      ],
      member: [
        {
          id: 'role-member-001',
          title: 'Creating Reports',
          content: 'Member can create and edit their own reports.',
          category: 'role',
          priority: 'medium',
          applicableRoles: ['member']
        },
        {
          id: 'role-member-002',
          title: 'Following Procedures',
          content: 'Member must follow all safety procedures.',
          category: 'role',
          priority: 'high',
          applicableRoles: ['member']
        }
      ]
    }
  };

  /**
   * Generates comprehensive rules content based on configuration
   * 
   * @param config - Configuration object containing user role, department, and preferences
   * @returns Promise<RulesContentResult> - Generated rules with metadata
   * 
   * @example
   * ```typescript
   * const rulesService = new RulesBuilderService();
   * const result = await rulesService.generateRulesContent({
   *   userRole: 'admin',
   *   fireDepartmentId: 'dept-123',
   *   systemVersion: '1.0.0',
   *   language: 'pl'
   * });
   * ```
   */
  async generateRulesContent(config: RuleConfig): Promise<RulesContentResult> {
    try {
      // Validate input configuration
      this.validateConfig(config);

      const language = config.language || 'pl';
      const rules: GeneratedRule[] = [];

      // Add system rules if enabled
      if (config.includeSystemRules !== false) {
        const systemRules = this.getSystemRules(language);
        rules.push(...systemRules);
      }

      // Add department-specific rules if enabled
      if (config.includeDepartmentRules !== false) {
        const departmentRules = await this.getDepartmentRules(config.fireDepartmentId, language);
        rules.push(...departmentRules);
      }

      // Add role-specific rules
      const roleRules = this.getRoleRules(config.userRole, language);
      rules.push(...roleRules);

      // Add custom rules if provided
      if (config.customRules && config.customRules.length > 0) {
        const customRules = this.processCustomRules(config.customRules, language);
        rules.push(...customRules);
      }

      // Filter rules based on user role
      const applicableRules = this.filterRulesByRole(rules, config.userRole);

      // Generate metadata
      const metadata = this.generateMetadata(applicableRules, language, config.systemVersion);

      return {
        rules: applicableRules,
        metadata
      };
    } catch (error) {
      throw new Error(`Failed to generate rules content: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates the input configuration
   */
  private validateConfig(config: RuleConfig): void {
    if (!config) {
      throw new Error('Configuration is required');
    }

    if (!config.userRole || !['admin', 'commander', 'member'].includes(config.userRole)) {
      throw new Error('Valid userRole is required (admin, commander, or member)');
    }

    if (!config.fireDepartmentId || typeof config.fireDepartmentId !== 'string') {
      throw new Error('Valid fireDepartmentId is required');
    }

    if (!config.systemVersion || typeof config.systemVersion !== 'string') {
      throw new Error('Valid systemVersion is required');
    }

    if (config.language && !['pl', 'en'].includes(config.language)) {
      throw new Error('Language must be either "pl" or "en"');
    }

    if (config.customRules && !Array.isArray(config.customRules)) {
      throw new Error('Custom rules must be an array');
    }
  }

  /**
   * Gets system rules for specified language
   */
  private getSystemRules(language: string): GeneratedRule[] {
    return this.systemRules[language] || this.systemRules['pl'];
  }

  /**
   * Gets department-specific rules (simulated - in real implementation would fetch from database)
   */
  private async getDepartmentRules(fireDepartmentId: string, language: string): Promise<GeneratedRule[]> {
    // Simulate async database call
    await new Promise(resolve => setTimeout(resolve, 10));

    const departmentRules: Record<string, GeneratedRule[]> = {
      pl: [
        {
          id: `dept-${fireDepartmentId}-001`,
          title: 'Zasady jednostki OSP',
          content: `Specyficzne zasady dla jednostki OSP o ID: ${fireDepartmentId}`,
          category: 'department',
          priority: 'medium',
          applicableRoles: ['admin', 'commander', 'member']
        }
      ],
      en: [
        {
          id: `dept-${fireDepartmentId}-001`,
          title: 'Fire Department Rules',
          content: `Specific rules for fire department with ID: ${fireDepartmentId}`,
          category: 'department',
          priority: 'medium',
          applicableRoles: ['admin', 'commander', 'member']
        }
      ]
    };

    return departmentRules[language] || departmentRules['pl'];
  }

  /**
   * Gets role-specific rules
   */
  private getRoleRules(userRole: string, language: string): GeneratedRule[] {
    const roleRulesForLang = this.roleRules[language] || this.roleRules['pl'];
    return roleRulesForLang[userRole] || [];
  }

  /**
   * Processes custom rules provided by user
   */
  private processCustomRules(customRules: string[], language: string): GeneratedRule[] {
    return customRules.map((rule, index) => ({
      id: `custom-${Date.now()}-${index}`,
      title: language === 'pl' ? 'Reguła niestandardowa' : 'Custom Rule',
      content: rule,
      category: 'custom' as const,
      priority: 'low' as const,
      applicableRoles: ['admin', 'commander', 'member']
    }));
  }

  /**
   * Filters rules based on user role
   */
  private filterRulesByRole(rules: GeneratedRule[], userRole: string): GeneratedRule[] {
    return rules.filter(rule => 
      rule.applicableRoles.includes(userRole)
    );
  }

  /**
   * Generates metadata for the rules content
   */
  private generateMetadata(rules: GeneratedRule[], language: string, systemVersion: string) {
    const categories = rules.reduce((acc, rule) => {
      acc[rule.category] = (acc[rule.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      generatedAt: new Date().toISOString(),
      totalRules: rules.length,
      categories,
      language,
      version: systemVersion
    };
  }

  /**
   * Gets available rule categories
   */
  getAvailableCategories(): string[] {
    return ['system', 'department', 'role', 'custom'];
  }

  /**
   * Gets available user roles
   */
  getAvailableRoles(): string[] {
    return ['admin', 'commander', 'member'];
  }

  /**
   * Gets available languages
   */
  getAvailableLanguages(): string[] {
    return ['pl', 'en'];
  }
}
