import type { Account, AccountTreeNode } from './account.types.js';

function compareCodes(a: string, b: string): number {
  return a.localeCompare(b);
}

function finalizeNode(node: AccountTreeNode): void {
  node.children.sort((left, right) => compareCodes(left.code, right.code));
  node.allowsMovements = node.children.length === 0;

  for (const child of node.children) {
    finalizeNode(child);
  }
}

export function buildAccountTree(accounts: readonly Account[]): AccountTreeNode[] {
  const nodesByCode = new Map<string, AccountTreeNode>();

  for (const account of accounts) {
    nodesByCode.set(account.code, {
      code: account.code,
      name: account.name,
      level: account.level,
      nature: account.nature,
      parentCode: account.parentCode,
      allowsMovements: true,
      children: [],
    });
  }

  const roots: AccountTreeNode[] = [];

  for (const node of nodesByCode.values()) {
    if (node.parentCode === null) {
      roots.push(node);
      continue;
    }

    const parent = nodesByCode.get(node.parentCode);
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }

  roots.sort((left, right) => compareCodes(left.code, right.code));
  for (const root of roots) {
    finalizeNode(root);
  }

  return roots;
}
