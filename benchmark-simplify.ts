import { simplifyDebts } from './src/lib/simplify';
import type { GroupBalance } from '@prisma/client';
import rawRealGraph from './src/tests/mock/example_group_balances.json';

const realGraph = rawRealGraph.map(({ amount, updatedAt, ...rest }) => ({
  ...rest,
  amount: BigInt(amount),
  updatedAt: new Date(updatedAt),
})) as GroupBalance[];

// Generate larger test data
function generateLargeGraph(userCount: number): GroupBalance[] {
  const balances: GroupBalance[] = [];
  for (let i = 0; i < userCount; i++) {
    for (let j = i + 1; j < userCount; j++) {
      const amount = BigInt(Math.floor(Math.random() * 100000));
      balances.push({
        userId: i,
        firendId: j,
        amount,
        groupId: 1,
        currency: 'USD',
        updatedAt: new Date(),
      });
      balances.push({
        userId: j,
        firendId: i,
        amount: -amount,
        groupId: 1,
        currency: 'USD',
        updatedAt: new Date(),
      });
    }
  }
  return balances;
}

function benchmark(name: string, fn: () => void, iterations: number = 100) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  const total = end - start;
  const avg = total / iterations;
  console.log(\:\);
  console.log(\  Total: \ms (\ iterations)\);
  console.log(\  Average: \ms per iteration\);
  return { total, avg, iterations };
}

console.log('=== PROFILING simplifyDebts ===\n');

console.log('Test 1: Real Graph (from test data)');
const realResult = benchmark('Real Graph', () => simplifyDebts(realGraph), 50);

console.log('\nTest 2: Small Graph (10 users)');
const small = generateLargeGraph(10);
const smallResult = benchmark('Small Graph (10 users)', () => simplifyDebts(small), 1000);

console.log('\nTest 3: Medium Graph (20 users)');
const medium = generateLargeGraph(20);
const mediumResult = benchmark('Medium Graph (20 users)', () => simplifyDebts(medium), 500);

console.log('\nTest 4: Large Graph (30 users)');
const large = generateLargeGraph(30);
const largeResult = benchmark('Large Graph (30 users)', () => simplifyDebts(large), 100);

console.log('\n=== SUMMARY ===');
console.log(JSON.stringify({
  real: realResult,
  small: smallResult,
  medium: mediumResult,
  large: largeResult
}, null, 2));
