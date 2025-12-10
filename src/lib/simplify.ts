import type { GroupBalance } from '@prisma/client';

export function simplifyDebts(groupBalances: GroupBalance[]): GroupBalance[] {
  const currencies = new Set(groupBalances.map((balance) => balance.currency));
  const nodes = new Set<number>();
  groupBalances.forEach((balance) => {
    nodes.add(balance.userId);
    nodes.add(balance.firendId);
  });
  const result: GroupBalance[] = [];

  for (const currency of currencies) {
    const balances = groupBalances.filter((balance) => balance.currency === currency);
    const simplified = simplifyDebtsForSingleCurrency(balances, Array.from(nodes.values()));
    result.push(...simplified);
  }

  return result;
}

function simplifyDebtsForSingleCurrency(
  groupBalances: GroupBalance[],
  nodes: number[],
): GroupBalance[] {
  const adjMatrix = new Array<bigint[]>(nodes.length)
    .fill([])
    .map(() => new Array<bigint>(nodes.length).fill(0n));

  const nonResidualBalances = groupBalances.filter((balance) => 0 < balance.amount);

  // OPTIMIZATION: Create Map for O(1) lookup instead of O(n) indexOf
  const nodeIndexMap = new Map<number, number>();
  nodes.forEach((nodeId, index) => nodeIndexMap.set(nodeId, index));

  nonResidualBalances.forEach((balance) => {
    const source = nodeIndexMap.get(balance.userId)!;
    const sink = nodeIndexMap.get(balance.firendId)!;
    adjMatrix[source]![sink] = balance.amount;
  });

  const simplified = minCashFlow(adjMatrix);

  // OPTIMIZATION: Create Map for O(1) balance lookup
  const balanceMap = new Map<string, GroupBalance>();
  groupBalances.forEach((balance) => {
    const key = `${balance.userId}-${balance.firendId}`;
    balanceMap.set(key, balance);
  });

  const result = getMirrorBalances(
    simplified.flatMap((row, source) => {
      const res: GroupBalance[] = [];
      row.forEach((amount, sink) => {
        if (0n === amount) {
          return;
        }

        const userId = nodes[source]!;
        const firendId = nodes[sink]!;
        const key = `${userId}-${firendId}`;
        const balance = balanceMap.get(key) ?? {};

        res.push({
          userId,
          firendId,
          currency: groupBalances[0]!.currency,
          updatedAt: new Date(),
          groupId: groupBalances[0]!.groupId,
          ...balance,
          amount,
        });
      });
      return res;
    }),
  );

  // OPTIMIZATION: Use Set for O(1) existence check
  const resultKeys = new Set<string>();
  result.forEach((balance) => {
    resultKeys.add(`${balance.userId}-${balance.firendId}`);
  });

  groupBalances.forEach((balance) => {
    const key = `${balance.userId}-${balance.firendId}`;
    if (!resultKeys.has(key)) {
      result.push({ ...balance, amount: 0n });
    }
  });

  return result;
}

// based on https://www.geeksforgeeks.org/minimize-cash-flow-among-given-set-friends-borrowed-money/
const minCashFlow = (graph: bigint[][]): bigint[][] => {
  const n = graph.length;

  const amounts = new Array<bigint>(n).fill(0n);
  for (let i = 0; i < n; ++i) {
    for (let j = 0; j < n; ++j) {
      const diff = graph[j]![i]! - graph[i]![j]!;
      amounts[i]! += diff;
    }
  }
  return solveTransaction(amounts);
};

const solveTransaction = (amounts: bigint[]): bigint[][] => {
  const [minQ, maxQ] = constructMinMaxQ(amounts);

  const result = new Array<bigint[]>(amounts.length)
    .fill([])
    .map(() => new Array<bigint>(amounts.length).fill(0n));

  // OPTIMIZATION: Use binary search insertion instead of full sort each time
  const insertSorted = (arr: Entry[], entry: Entry, reverse = false) => {
    let left = 0;
    let right = arr.length;
    const compareValue = entry.value;
    
    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      const midValue = arr[mid]!.value;
      if (reverse ? midValue < compareValue : midValue > compareValue) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }
    arr.splice(left, 0, entry);
  };

  while (0 < minQ.length && 0 < maxQ.length) {
    const maxCreditEntry = maxQ.pop()!;
    const maxDebitEntry = minQ.pop()!;

    const transaction_val = maxCreditEntry.value + maxDebitEntry.value;

    const debtor = maxDebitEntry.key;
    const creditor = maxCreditEntry.key;
    let owed_amount = maxCreditEntry.value;

    if (0 > transaction_val) {
      maxDebitEntry.value = transaction_val;
      insertSorted(minQ, maxDebitEntry, true);
    } else {
      owed_amount = -maxDebitEntry.value;
      maxCreditEntry.value = transaction_val;
      insertSorted(maxQ, maxCreditEntry, false);
    }

    result[debtor]![creditor] = owed_amount;
  }

  return result;
};

const compareAsc = (p1: Entry, p2: Entry): number => Number(p1.value - p2.value);

const constructMinMaxQ = (amounts: bigint[]): [Entry[], Entry[]] => {
  const minQ: Entry[] = [];
  const maxQ: Entry[] = [];
  amounts.forEach((amount, index) => {
    if (0n === amount) {
      return;
    }
    if (0 < amount) {
      maxQ.push({ key: index, value: amount });
    } else {
      minQ.push({ key: index, value: amount });
    }
  });

  maxQ.sort(compareAsc);
  minQ.sort(compareAsc);
  minQ.reverse();

  return [minQ, maxQ];
};

const getMirrorBalances = (groupBalances: GroupBalance[]): GroupBalance[] => {
  const result = [...groupBalances];

  groupBalances.forEach((balance) => {
    result.push({
      ...balance,
      userId: balance.firendId,
      firendId: balance.userId,
      amount: 0 < balance.amount ? -balance.amount : 0n,
    });
  });

  return result;
};

interface Entry {
  key: number;
  value: bigint;
}
