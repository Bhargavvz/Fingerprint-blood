export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  message: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: { [key: string]: string };
}

export class DataValidator {
  static validateField(value: string, rules: ValidationRule[]): string | null {
    for (const rule of rules) {
      // Required validation
      if (rule.required && (!value || value.trim().length === 0)) {
        return rule.message;
      }

      // Skip other validations if field is empty and not required
      if (!value || value.trim().length === 0) {
        continue;
      }

      // Min length validation
      if (rule.minLength && value.length < rule.minLength) {
        return rule.message;
      }

      // Max length validation
      if (rule.maxLength && value.length > rule.maxLength) {
        return rule.message;
      }

      // Pattern validation
      if (rule.pattern && !rule.pattern.test(value)) {
        return rule.message;
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        return rule.message;
      }
    }

    return null;
  }

  static validateData(data: { [key: string]: string }, schema: ValidationSchema): ValidationResult {
    const errors: { [key: string]: string } = {};

    for (const [field, rules] of Object.entries(schema)) {
      const error = this.validateField(data[field] || '', rules);
      if (error) {
        errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  // Pre-defined validation rules
  static rules = {
    email: {
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Please enter a valid email address',
    },
    password: {
      minLength: 8,
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: 'Password must be at least 8 characters with uppercase, lowercase, and number',
    },
    name: {
      minLength: 2,
      maxLength: 50,
      pattern: /^[a-zA-Z\s]+$/,
      message: 'Name must be 2-50 characters and contain only letters',
    },
    required: {
      required: true,
      message: 'This field is required',
    },
  };

  // Sanitization methods
  static sanitize = {
    email: (email: string): string => {
      return email.toLowerCase().trim();
    },
    name: (name: string): string => {
      return name.trim().replace(/\s+/g, ' ');
    },
    general: (input: string): string => {
      return input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').trim();
    },
  };

  // Blood group validation
  static validateBloodGroup(bloodGroup: string): boolean {
    const validGroups = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
    return validGroups.includes(bloodGroup);
  }

  // Confidence validation
  static validateConfidence(confidence: number): boolean {
    return confidence >= 0 && confidence <= 100;
  }

  // Date validation
  static validateScanDate(date: Date): boolean {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    return date >= oneYearAgo && date <= now;
  }
}

// Form validation schemas
export const authSchemas = {
  login: {
    email: [DataValidator.rules.required, DataValidator.rules.email],
    password: [DataValidator.rules.required],
  },
  signup: {
    name: [DataValidator.rules.required, DataValidator.rules.name],
    email: [DataValidator.rules.required, DataValidator.rules.email],
    password: [DataValidator.rules.required, DataValidator.rules.password],
  },
};

export const settingsSchemas = {
  profile: {
    name: [DataValidator.rules.name],
    email: [DataValidator.rules.email],
  },
};

// Export type helper
export type FormData = { [key: string]: string };
