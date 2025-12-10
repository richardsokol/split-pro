import { type TFunction } from 'next-i18next';
import { type User } from '@prisma/client';
import { displayName, toUIDate, getCurrencyName, generateSplitDescription } from '../utils/strings';
import { SplitType } from '@prisma/client';
import { type Participant, type AddExpenseState } from '~/store/addStore';

// Mock translation function
const mockT: TFunction = jest.fn((key: string, options?: any) => {
  const translations: Record<string, string> = {
    'actors.you': 'You',
    'actors.you_dativus': 'You',
    'actors.you_accusativus': 'You',
    'ui.today': 'Today',
    'ui.expense.user.paid': 'paid',
    'ui.expense.for': 'for',
    'expense_details.add_expense_details.split_type_section.split_equally': 'Split equally',
    'expense_details.add_expense_details.split_type_section.split_unequally': 'Split unequally',
    'currencies:currency_list.USD.name': 'US Dollar',
    'currencies:currency_list.USD.name_plural': 'US Dollars',
    'currencies:currency_list.EUR.name': 'Euro',
    'currencies:currency_list.EUR.name_plural': 'Euros',
  };
  return translations[key] || key;
}) as TFunction;

describe('strings.ts utility functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('displayName', () => {
    const mockUser: Pick<User, 'name' | 'email' | 'id'> = {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
    };

    it('should return "You" when user is current user', () => {
      const result = displayName(mockT, mockUser, 1);
      expect(result).toBe('You');
      expect(mockT).toHaveBeenCalledWith('actors.you');
    });

    it('should return "You" with dativus case when user is current user', () => {
      const result = displayName(mockT, mockUser, 1, 'dativus');
      expect(result).toBe('You');
      expect(mockT).toHaveBeenCalledWith('actors.you_dativus');
    });

    it('should return "You" with accusativus case when user is current user', () => {
      const result = displayName(mockT, mockUser, 1, 'accusativus');
      expect(result).toBe('You');
      expect(mockT).toHaveBeenCalledWith('actors.you_accusativus');
    });

    it('should return user name when user is not current user', () => {
      const result = displayName(mockT, mockUser, 2);
      expect(result).toBe('John Doe');
    });

    it('should return user email when name is not available', () => {
      const userWithoutName = { ...mockUser, name: null };
      const result = displayName(mockT, userWithoutName, 2);
      expect(result).toBe('john@example.com');
    });

    it('should return empty string when user is null', () => {
      const result = displayName(mockT, null, 2);
      expect(result).toBe('');
    });

    it('should return empty string when user is undefined', () => {
      const result = displayName(mockT, undefined, 2);
      expect(result).toBe('');
    });
  });

  describe('toUIDate', () => {
    it('should return "Today" when date is today and useToday is true', () => {
      const today = new Date();
      const result = toUIDate(mockT, today, { useToday: true });
      expect(result).toBe('Today');
    });

    it('should format date without year by default', () => {
      const date = new Date('2024-03-15');
      const result = toUIDate(mockT, date, { useToday: false });
      expect(result).toMatch(/Mar 15/);
    });

    it('should format date with year when year option is true', () => {
      const date = new Date('2024-03-15');
      const result = toUIDate(mockT, date, { year: true });
      expect(result).toMatch(/15 Mar 2024/);
    });

    it('should not return "Today" when useToday is false even if date is today', () => {
      const today = new Date();
      const result = toUIDate(mockT, today, { useToday: false });
      expect(result).not.toBe('Today');
    });
  });

  describe('getCurrencyName', () => {
    it('should return translated currency name for singular', () => {
      const result = getCurrencyName(mockT, 'USD', false);
      expect(result).toBe('US Dollar');
    });

    it('should return translated currency name for plural', () => {
      const result = getCurrencyName(mockT, 'USD', true);
      expect(result).toBe('US Dollars');
    });

    it('should return currency code when translation is not available', () => {
      const result = getCurrencyName(mockT, 'XYZ' as any, false);
      expect(result).toBe('XYZ');
    });

    it('should handle EUR currency correctly', () => {
      const singular = getCurrencyName(mockT, 'EUR', false);
      const plural = getCurrencyName(mockT, 'EUR', true);
      expect(singular).toBe('Euro');
      expect(plural).toBe('Euros');
    });
  });

  describe('generateSplitDescription', () => {
    const createMockParticipant = (id: number, name: string): Participant => ({
      id,
      name,
      email: `${name.toLowerCase()}@example.com`,
      currency: 'USD',
      emailVerified: null,
      image: null,
      preferredLanguage: 'en',
      obapiProviderId: null,
      bankingId: null,
      amount: 0n,
    });

    const participant1 = createMockParticipant(1, 'Alice');
    const participant2 = createMockParticipant(2, 'Bob');
    const participant3 = createMockParticipant(3, 'Charlie');

    it('should return "Split unequally" for non-EQUAL split types', () => {
      const participants = [participant1, participant2];
      const splitShares: AddExpenseState['splitShares'] = {};
      
      const result = generateSplitDescription(
        mockT,
        SplitType.PERCENTAGE,
        participants,
        splitShares,
        participant1,
        participant1,
      );
      
      expect(result).toBe('Split unequally');
    });

    it('should return "Split equally" when no paidBy is provided', () => {
      const participants = [participant1, participant2];
      const splitShares: AddExpenseState['splitShares'] = {};
      
      const result = generateSplitDescription(
        mockT,
        SplitType.EQUAL,
        participants,
        splitShares,
        undefined,
        participant1,
      );
      
      expect(result).toBe('Split equally');
    });

    it('should return "paid for [name]" when splitting for exactly one person', () => {
      const participants = [participant2];
      const splitShares: AddExpenseState['splitShares'] = {
        [participant2.id]: { [SplitType.EQUAL]: 1n } as any,
      };
      
      const result = generateSplitDescription(
        mockT,
        SplitType.EQUAL,
        participants,
        splitShares,
        participant1,
        participant1,
      );
      
      expect(result).toBe('paid for Bob');
    });

    it('should return "Split equally (X)" when splitting with multiple people', () => {
      const participants = [participant1, participant2, participant3];
      const splitShares: AddExpenseState['splitShares'] = {
        [participant1.id]: { [SplitType.EQUAL]: 1n } as any,
        [participant2.id]: { [SplitType.EQUAL]: 1n } as any,
        [participant3.id]: { [SplitType.EQUAL]: 1n } as any,
      };
      
      const result = generateSplitDescription(
        mockT,
        SplitType.EQUAL,
        participants,
        splitShares,
        participant1,
        participant1,
      );
      
      expect(result).toBe('Split equally (3)');
    });

    it('should filter out participants with 0 share', () => {
      const participants = [participant1, participant2, participant3];
      const splitShares: AddExpenseState['splitShares'] = {
        [participant1.id]: { [SplitType.EQUAL]: 1n } as any,
        [participant2.id]: { [SplitType.EQUAL]: 0n } as any,
        [participant3.id]: { [SplitType.EQUAL]: 1n } as any,
      };
      
      const result = generateSplitDescription(
        mockT,
        SplitType.EQUAL,
        participants,
        splitShares,
        participant1,
        participant1,
      );
      
      expect(result).toBe('Split equally (2)');
    });

    it('should include all participants when splitShares are undefined', () => {
      const participants = [participant1, participant2, participant3];
      const splitShares: AddExpenseState['splitShares'] = {};
      
      const result = generateSplitDescription(
        mockT,
        SplitType.EQUAL,
        participants,
        splitShares,
        participant1,
        participant1,
      );
      
      expect(result).toBe('Split equally (3)');
    });
  });
});
