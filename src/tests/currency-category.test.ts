import { CURRENCIES, isCurrencyCode, parseCurrencyCode, type CurrencyCode } from '../lib/currency';
import { CATEGORIES, DEFAULT_CATEGORY, type CategorySection } from '../lib/category';

describe('currency.ts utility functions', () => {
  describe('CURRENCIES constant', () => {
    it('should contain USD currency', () => {
      expect(CURRENCIES.USD).toBeDefined();
      expect(CURRENCIES.USD.code).toBe('USD');
      expect(CURRENCIES.USD.symbol).toBe('$');
      expect(CURRENCIES.USD.decimalDigits).toBe(2);
    });

    it('should contain EUR currency', () => {
      expect(CURRENCIES.EUR).toBeDefined();
      expect(CURRENCIES.EUR.code).toBe('EUR');
      expect(CURRENCIES.EUR.symbol).toBe('€');
      expect(CURRENCIES.EUR.decimalDigits).toBe(2);
    });

    it('should contain JPY with 0 decimal digits', () => {
      expect(CURRENCIES.JPY).toBeDefined();
      expect(CURRENCIES.JPY.decimalDigits).toBe(0);
    });

    it('should contain BHD with 3 decimal digits', () => {
      expect(CURRENCIES.BHD).toBeDefined();
      expect(CURRENCIES.BHD.decimalDigits).toBe(3);
    });

    it('should have CHF with rounding', () => {
      expect(CURRENCIES.CHF).toBeDefined();
      expect(CURRENCIES.CHF.rounding).toBe(0.05);
    });

    it('should have all currencies with required properties', () => {
      Object.values(CURRENCIES).forEach((currency) => {
        expect(currency).toHaveProperty('symbol');
        expect(currency).toHaveProperty('symbolNative');
        expect(currency).toHaveProperty('decimalDigits');
        expect(currency).toHaveProperty('rounding');
        expect(currency).toHaveProperty('code');
      });
    });
  });

  describe('isCurrencyCode', () => {
    it('should return true for valid currency code USD', () => {
      expect(isCurrencyCode('USD')).toBe(true);
    });

    it('should return true for valid currency code EUR', () => {
      expect(isCurrencyCode('EUR')).toBe(true);
    });

    it('should return true for valid currency code JPY', () => {
      expect(isCurrencyCode('JPY')).toBe(true);
    });

    it('should return false for invalid currency code', () => {
      expect(isCurrencyCode('INVALID')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isCurrencyCode('')).toBe(false);
    });

    it('should return false for lowercase currency code', () => {
      expect(isCurrencyCode('usd')).toBe(false);
    });

    it('should return false for partial currency code', () => {
      expect(isCurrencyCode('US')).toBe(false);
    });

    it('should work as type guard', () => {
      const code: string = 'USD';
      if (isCurrencyCode(code)) {
        // Type should be narrowed to CurrencyCode
        const currency = CURRENCIES[code];
        expect(currency).toBeDefined();
      }
    });
  });

  describe('parseCurrencyCode', () => {
    it('should return valid currency code unchanged', () => {
      expect(parseCurrencyCode('EUR')).toBe('EUR');
      expect(parseCurrencyCode('USD')).toBe('USD');
      expect(parseCurrencyCode('GBP')).toBe('GBP');
    });

    it('should return USD for invalid currency code', () => {
      expect(parseCurrencyCode('INVALID')).toBe('USD');
    });

    it('should return USD for empty string', () => {
      expect(parseCurrencyCode('')).toBe('USD');
    });

    it('should return USD for lowercase currency code', () => {
      expect(parseCurrencyCode('eur')).toBe('USD');
    });

    it('should return USD for partial currency code', () => {
      expect(parseCurrencyCode('EU')).toBe('USD');
    });

    it('should handle all valid currency codes', () => {
      const validCodes: CurrencyCode[] = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'];
      validCodes.forEach((code) => {
        expect(parseCurrencyCode(code)).toBe(code);
      });
    });
  });
});

describe('category.ts utility functions', () => {
  describe('CATEGORIES constant', () => {
    it('should contain entertainment category with subcategories', () => {
      expect(CATEGORIES.entertainment).toBeDefined();
      expect(CATEGORIES.entertainment).toContain('games');
      expect(CATEGORIES.entertainment).toContain('movies');
      expect(CATEGORIES.entertainment).toContain('music');
      expect(CATEGORIES.entertainment).toContain('other');
    });

    it('should contain food category with subcategories', () => {
      expect(CATEGORIES.food).toBeDefined();
      expect(CATEGORIES.food).toContain('diningOut');
      expect(CATEGORIES.food).toContain('groceries');
      expect(CATEGORIES.food).toContain('liquor');
    });

    it('should contain home category with subcategories', () => {
      expect(CATEGORIES.home).toBeDefined();
      expect(CATEGORIES.home).toContain('rent');
      expect(CATEGORIES.home).toContain('mortgage');
      expect(CATEGORIES.home).toContain('furniture');
    });

    it('should contain travel category with subcategories', () => {
      expect(CATEGORIES.travel).toBeDefined();
      expect(CATEGORIES.travel).toContain('car');
      expect(CATEGORIES.travel).toContain('plane');
      expect(CATEGORIES.travel).toContain('hotel');
      expect(CATEGORIES.travel).toContain('taxi');
    });

    it('should contain utilities category with subcategories', () => {
      expect(CATEGORIES.utilities).toBeDefined();
      expect(CATEGORIES.utilities).toContain('electricity');
      expect(CATEGORIES.utilities).toContain('water');
      expect(CATEGORIES.utilities).toContain('internet');
    });

    it('should contain general category', () => {
      expect(CATEGORIES.general).toBeDefined();
      expect(CATEGORIES.general).toContain('general');
    });

    it('should have "other" subcategory in each category', () => {
      Object.values(CATEGORIES).forEach((subcategories) => {
        expect(subcategories).toContain('other');
      });
    });

    it('should have life category with insurance, medical, taxes', () => {
      expect(CATEGORIES.life).toBeDefined();
      expect(CATEGORIES.life).toContain('insurance');
      expect(CATEGORIES.life).toContain('medical');
      expect(CATEGORIES.life).toContain('taxes');
      expect(CATEGORIES.life).toContain('education');
    });
  });

  describe('DEFAULT_CATEGORY constant', () => {
    it('should be "general"', () => {
      expect(DEFAULT_CATEGORY).toBe('general');
    });

    it('should exist in CATEGORIES', () => {
      expect(CATEGORIES[DEFAULT_CATEGORY as CategorySection]).toBeDefined();
    });
  });

  describe('category type validations', () => {
    it('should have all main categories defined', () => {
      const expectedCategories = [
        'entertainment',
        'food',
        'home',
        'life',
        'travel',
        'utilities',
        'general',
      ];
      
      expectedCategories.forEach((category) => {
        expect(CATEGORIES).toHaveProperty(category);
      });
    });

    it('should have consistent structure across all categories', () => {
      Object.entries(CATEGORIES).forEach(([key, subcategories]) => {
        expect(Array.isArray(subcategories)).toBe(true);
        expect(subcategories.length).toBeGreaterThan(0);
        subcategories.forEach((subcat) => {
          expect(typeof subcat).toBe('string');
        });
      });
    });
  });
});
