import { shuffleArray } from '../utils/array';

describe('array.ts utility functions', () => {
  describe('shuffleArray', () => {
    it('should shuffle array in place with controlled randomness', () => {
      const array = [1, 2, 3, 4, 5];
      
      // Mock Math.random to create a specific shuffle pattern
      let callCount = 0;
      const mockRandom = jest.spyOn(Math, 'random').mockImplementation(() => {
        callCount++;
        return callCount % 2 === 0 ? 0.8 : 0.2;
      });
      
      shuffleArray(array);
      
      // Array should still contain all original elements
      expect(array.length).toBe(5);
      expect(array.sort()).toEqual([1, 2, 3, 4, 5]);
      
      mockRandom.mockRestore();
    });

    it('should handle empty array', () => {
      const array: number[] = [];
      shuffleArray(array);
      expect(array).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [1];
      shuffleArray(array);
      expect(array).toEqual([1]);
    });

    it('should maintain all elements after shuffle', () => {
      const array = [10, 20, 30, 40, 50];
      const sumBefore = array.reduce((a, b) => a + b, 0);
      
      shuffleArray(array);
      
      const sumAfter = array.reduce((a, b) => a + b, 0);
      expect(sumAfter).toBe(sumBefore);
      expect(array).toContain(10);
      expect(array).toContain(20);
      expect(array).toContain(30);
      expect(array).toContain(40);
      expect(array).toContain(50);
    });

    it('should work with different data types', () => {
      const stringArray = ['apple', 'banana', 'cherry'];
      const originalLength = stringArray.length;
      
      shuffleArray(stringArray);
      
      expect(stringArray.length).toBe(originalLength);
      expect(stringArray).toContain('apple');
      expect(stringArray).toContain('banana');
      expect(stringArray).toContain('cherry');
    });

    it('should work with object array', () => {
      const objectArray = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' },
      ];
      const originalIds = objectArray.map(obj => obj.id);
      
      shuffleArray(objectArray);
      
      const shuffledIds = objectArray.map(obj => obj.id);
      expect(shuffledIds.sort()).toEqual(originalIds.sort());
    });
  });
});
