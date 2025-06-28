import AsyncStorage from '@react-native-async-storage/async-storage';
import { Contact } from '../context/ContactsContext';

export interface TagRule {
  id: string;
  name: string;
  description: string;
  conditions: TagCondition[];
  priority: number;
  isEnabled: boolean;
  autoApply: boolean;
}

export interface TagCondition {
  field: keyof Contact;
  operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
  value: string;
  caseSensitive?: boolean;
}

export interface SuggestedTag {
  tag: string;
  confidence: number;
  reason: string;
  source: 'rule' | 'ml' | 'pattern';
}

class AutoTaggingService {
  private static instance: AutoTaggingService;
  private tagRules: TagRule[] = [];
  private readonly RULES_STORAGE_KEY = 'auto_tagging_rules';

  private constructor() {
    this.initializeDefaultRules();
    this.loadRules();
  }

  static getInstance(): AutoTaggingService {
    if (!AutoTaggingService.instance) {
      AutoTaggingService.instance = new AutoTaggingService();
    }
    return AutoTaggingService.instance;
  }

  private initializeDefaultRules() {
    this.tagRules = [
      // Company-based rules
      {
        id: 'tech_company',
        name: 'Tech Company',
        description: 'Contacts working in technology companies',
        conditions: [
          {
            field: 'company',
            operator: 'contains',
            value: 'tech',
            caseSensitive: false
          }
        ],
        priority: 1,
        isEnabled: true,
        autoApply: true
      },
      {
        id: 'finance_company',
        name: 'Finance',
        description: 'Contacts working in finance/banking',
        conditions: [
          {
            field: 'company',
            operator: 'contains',
            value: 'bank',
            caseSensitive: false
          },
          {
            field: 'company',
            operator: 'contains',
            value: 'finance',
            caseSensitive: false
          },
          {
            field: 'company',
            operator: 'contains',
            value: 'investment',
            caseSensitive: false
          }
        ],
        priority: 1,
        isEnabled: true,
        autoApply: true
      },
      {
        id: 'healthcare',
        name: 'Healthcare',
        description: 'Contacts in healthcare industry',
        conditions: [
          {
            field: 'company',
            operator: 'contains',
            value: 'hospital',
            caseSensitive: false
          },
          {
            field: 'company',
            operator: 'contains',
            value: 'medical',
            caseSensitive: false
          },
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'doctor',
            caseSensitive: false
          },
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'nurse',
            caseSensitive: false
          }
        ],
        priority: 1,
        isEnabled: true,
        autoApply: true
      },

      // Job title-based rules
      {
        id: 'executive',
        name: 'Executive',
        description: 'Senior executives and managers',
        conditions: [
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'ceo',
            caseSensitive: false
          },
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'director',
            caseSensitive: false
          },
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'manager',
            caseSensitive: false
          },
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'president',
            caseSensitive: false
          }
        ],
        priority: 2,
        isEnabled: true,
        autoApply: true
      },
      {
        id: 'developer',
        name: 'Developer',
        description: 'Software developers and engineers',
        conditions: [
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'developer',
            caseSensitive: false
          },
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'engineer',
            caseSensitive: false
          },
          {
            field: 'jobTitle',
            operator: 'contains',
            value: 'programmer',
            caseSensitive: false
          }
        ],
        priority: 2,
        isEnabled: true,
        autoApply: true
      },

      // Location-based rules
      {
        id: 'local_contact',
        name: 'Local',
        description: 'Contacts in the same city/area',
        conditions: [
          {
            field: 'address',
            operator: 'contains',
            value: 'san francisco',
            caseSensitive: false
          },
          {
            field: 'address',
            operator: 'contains',
            value: 'sf',
            caseSensitive: false
          }
        ],
        priority: 3,
        isEnabled: true,
        autoApply: true
      },

      // Relationship-based rules
      {
        id: 'family',
        name: 'Family',
        description: 'Family members',
        conditions: [
          {
            field: 'group',
            operator: 'equals',
            value: 'Family'
          }
        ],
        priority: 1,
        isEnabled: true,
        autoApply: true
      },
      {
        id: 'work',
        name: 'Work',
        description: 'Work colleagues',
        conditions: [
          {
            field: 'group',
            operator: 'equals',
            value: 'Work'
          }
        ],
        priority: 1,
        isEnabled: true,
        autoApply: true
      },

      // Special contact types
      {
        id: 'emergency',
        name: 'Emergency',
        description: 'Emergency contacts',
        conditions: [
          {
            field: 'isEmergencyContact',
            operator: 'equals',
            value: 'true'
          }
        ],
        priority: 1,
        isEnabled: true,
        autoApply: true
      },
      {
        id: 'vip',
        name: 'VIP',
        description: 'VIP contacts',
        conditions: [
          {
            field: 'isVIP',
            operator: 'equals',
            value: 'true'
          }
        ],
        priority: 1,
        isEnabled: true,
        autoApply: true
      }
    ];
  }

  private async loadRules() {
    try {
      const stored = await AsyncStorage.getItem(this.RULES_STORAGE_KEY);
      if (stored) {
        const loadedRules = JSON.parse(stored);
        this.tagRules = [...this.tagRules, ...loadedRules];
      }
    } catch (error) {
      console.error('Error loading tag rules:', error);
    }
  }

  private async saveRules() {
    try {
      const customRules = this.tagRules.filter(rule => !rule.id.includes('_'));
      await AsyncStorage.setItem(this.RULES_STORAGE_KEY, JSON.stringify(customRules));
    } catch (error) {
      console.error('Error saving tag rules:', error);
    }
  }

  // Analyze a contact and suggest tags
  analyzeContact(contact: Contact): SuggestedTag[] {
    const suggestions: SuggestedTag[] = [];

    // Apply rule-based tagging
    this.tagRules
      .filter(rule => rule.isEnabled)
      .sort((a, b) => a.priority - b.priority)
      .forEach(rule => {
        if (this.evaluateRule(contact, rule)) {
          suggestions.push({
            tag: rule.name,
            confidence: 0.9,
            reason: rule.description,
            source: 'rule'
          });
        }
      });

    // Apply ML-like pattern recognition
    const mlSuggestions = this.applyMLPatterns(contact);
    suggestions.push(...mlSuggestions);

    // Remove duplicates and sort by confidence
    const uniqueSuggestions = this.removeDuplicateSuggestions(suggestions);
    return uniqueSuggestions.sort((a, b) => b.confidence - a.confidence);
  }

  private evaluateRule(contact: Contact, rule: TagRule): boolean {
    return rule.conditions.every(condition => {
      const fieldValue = this.getFieldValue(contact, condition.field);
      return this.evaluateCondition(fieldValue, condition);
    });
  }

  private getFieldValue(contact: Contact, field: keyof Contact): string {
    const value = contact[field];
    if (typeof value === 'string') return value;
    if (typeof value === 'boolean') return value.toString();
    if (Array.isArray(value)) return value.map(v => v.toString()).join(' ');
    return '';
  }

  private evaluateCondition(value: string, condition: TagCondition): boolean {
    const targetValue = condition.value;
    const compareValue = condition.caseSensitive ? value : value.toLowerCase();
    const compareTarget = condition.caseSensitive ? targetValue : targetValue.toLowerCase();

    switch (condition.operator) {
      case 'contains':
        return compareValue.includes(compareTarget);
      case 'equals':
        return compareValue === compareTarget;
      case 'startsWith':
        return compareValue.startsWith(compareTarget);
      case 'endsWith':
        return compareValue.endsWith(compareTarget);
      case 'regex':
        try {
          const regex = new RegExp(compareTarget, condition.caseSensitive ? '' : 'i');
          return regex.test(compareValue);
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private applyMLPatterns(contact: Contact): SuggestedTag[] {
    const suggestions: SuggestedTag[] = [];

    // Email domain analysis
    const primaryEmail = contact.emailAddresses?.find(e => e.isPrimary)?.email;
    if (primaryEmail) {
      const domain = primaryEmail.split('@')[1]?.toLowerCase();
      if (domain) {
        if (domain.includes('gmail')) {
          suggestions.push({
            tag: 'Personal',
            confidence: 0.7,
            reason: 'Uses personal email domain',
            source: 'ml'
          });
        } else if (domain.includes('outlook') || domain.includes('hotmail')) {
          suggestions.push({
            tag: 'Personal',
            confidence: 0.6,
            reason: 'Uses personal email domain',
            source: 'ml'
          });
        } else {
          suggestions.push({
            tag: 'Professional',
            confidence: 0.8,
            reason: 'Uses company email domain',
            source: 'ml'
          });
        }
      }
    }

    // Name pattern analysis
    if (contact.name) {
      const nameParts = contact.name.split(' ');
      if (nameParts.length === 1) {
        suggestions.push({
          tag: 'Single Name',
          confidence: 0.5,
          reason: 'Contact has only one name',
          source: 'ml'
        });
      }
    }

    // Phone number analysis
    const primaryPhone = contact.phoneNumbers?.find(p => p.isPrimary)?.number;
    if (primaryPhone) {
      const cleanPhone = primaryPhone.replace(/\D/g, '');
      if (cleanPhone.length === 10) {
        suggestions.push({
          tag: 'US Phone',
          confidence: 0.6,
          reason: 'US phone number format',
          source: 'ml'
        });
      }
    }

    // Social media presence
    if (contact.socialMedia) {
      if (contact.socialMedia.includes('@')) {
        suggestions.push({
          tag: 'Social Media',
          confidence: 0.7,
          reason: 'Has social media handle',
          source: 'ml'
        });
      }
    }

    // Website analysis
    if (contact.website) {
      if (contact.website.includes('linkedin.com')) {
        suggestions.push({
          tag: 'LinkedIn',
          confidence: 0.9,
          reason: 'Has LinkedIn profile',
          source: 'ml'
        });
      }
    }

    return suggestions;
  }

  private removeDuplicateSuggestions(suggestions: SuggestedTag[]): SuggestedTag[] {
    const seen = new Set<string>();
    return suggestions.filter(suggestion => {
      const key = suggestion.tag.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // Auto-apply tags to a contact
  async autoTagContact(contact: Contact): Promise<string[]> {
    const suggestions = this.analyzeContact(contact);
    
    // For Google contacts, be more conservative with auto-tagging
    // Don't override existing labels that came from Google
    const isGoogleContact = contact.googleResourceName || contact.group === 'Google Contacts';
    
    if (isGoogleContact && contact.labels && contact.labels.length > 0) {
      console.log('Skipping auto-tagging for Google contact with existing labels:', contact.name);
      return [];
    }
    
    const autoApplyTags = suggestions
      .filter(suggestion => {
        const rule = this.tagRules.find(r => r.name === suggestion.tag);
        return rule?.autoApply || suggestion.confidence > 0.8;
      })
      .map(suggestion => suggestion.tag);

    return autoApplyTags;
  }

  // Add a custom tag rule
  async addTagRule(rule: Omit<TagRule, 'id'>): Promise<string> {
    const newRule: TagRule = {
      ...rule,
      id: `custom_${Date.now()}`
    };

    this.tagRules.push(newRule);
    await this.saveRules();
    return newRule.id;
  }

  // Update a tag rule
  async updateTagRule(ruleId: string, updates: Partial<TagRule>): Promise<boolean> {
    const ruleIndex = this.tagRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;

    this.tagRules[ruleIndex] = { ...this.tagRules[ruleIndex], ...updates };
    await this.saveRules();
    return true;
  }

  // Remove a tag rule
  async removeTagRule(ruleId: string): Promise<boolean> {
    const ruleIndex = this.tagRules.findIndex(r => r.id === ruleId);
    if (ruleIndex === -1) return false;

    this.tagRules.splice(ruleIndex, 1);
    await this.saveRules();
    return true;
  }

  // Get all tag rules
  getTagRules(): TagRule[] {
    return [...this.tagRules];
  }

  // Get enabled tag rules
  getEnabledTagRules(): TagRule[] {
    return this.tagRules.filter(rule => rule.isEnabled);
  }
}

export default AutoTaggingService; 