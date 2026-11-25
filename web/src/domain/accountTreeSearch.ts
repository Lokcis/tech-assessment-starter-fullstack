import type { AccountTreeNode } from '../types/account'

export interface AccountTreeSearchResult {
  nodes: AccountTreeNode[]
  matchedCodes: Set<string>
  autoExpandedCodes: Set<string>
  matchCount: number
  isSearching: boolean
}

export interface HighlightSegment {
  text: string
  highlighted: boolean
}

export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function searchAccountTree(
  nodes: AccountTreeNode[],
  rawQuery: string,
): AccountTreeSearchResult {
  const normalizedQuery = normalizeSearchText(rawQuery.trim())

  if (!normalizedQuery) {
    return {
      nodes,
      matchedCodes: new Set<string>(),
      autoExpandedCodes: new Set<string>(),
      matchCount: 0,
      isSearching: false,
    }
  }

  const matchedCodes = new Set<string>()
  const autoExpandedCodes = new Set<string>()

  const filterNodes = (list: AccountTreeNode[]): AccountTreeNode[] => {
    const result: AccountTreeNode[] = []

    for (const node of list) {
      const codeMatches = normalizeSearchText(node.code).includes(normalizedQuery)
      const nameMatches = normalizeSearchText(node.name).includes(normalizedQuery)
      const isDirectMatch = codeMatches || nameMatches

      const filteredChildren = filterNodes(node.children)
      const hasMatchingDescendant = filteredChildren.length > 0

      if (isDirectMatch) {
        matchedCodes.add(node.code)
      }

      if (hasMatchingDescendant) {
        autoExpandedCodes.add(node.code)
      }

      if (isDirectMatch || hasMatchingDescendant) {
        result.push({
          ...node,
          children: filteredChildren,
        })
      }
    }

    return result
  }

  const filtered = filterNodes(nodes)

  return {
    nodes: filtered,
    matchedCodes,
    autoExpandedCodes,
    matchCount: matchedCodes.size,
    isSearching: true,
  }
}

export function getHighlightSegments(
  text: string,
  rawQuery: string,
): HighlightSegment[] {
  const normalizedQuery = normalizeSearchText(rawQuery.trim())
  if (!normalizedQuery || !text) {
    return [{ text, highlighted: false }]
  }

  const chars = Array.from(text)
  let normalizedText = ''
  const indexMap: number[] = []

  for (let i = 0; i < chars.length; i += 1) {
    const normalizedChar = normalizeSearchText(chars[i])
    for (let j = 0; j < normalizedChar.length; j += 1) {
      normalizedText += normalizedChar[j]
      indexMap.push(i)
    }
  }

  const segments: HighlightSegment[] = []
  let searchPos = 0
  let lastOrigIdx = 0

  while (searchPos < normalizedText.length) {
    const matchIndex = normalizedText.indexOf(normalizedQuery, searchPos)
    if (matchIndex === -1) {
      break
    }

    const origStart = indexMap[matchIndex]
    const origEnd = indexMap[matchIndex + normalizedQuery.length - 1] + 1

    if (origStart > lastOrigIdx) {
      segments.push({
        text: chars.slice(lastOrigIdx, origStart).join(''),
        highlighted: false,
      })
    }

    segments.push({
      text: chars.slice(origStart, origEnd).join(''),
      highlighted: true,
    })

    lastOrigIdx = origEnd
    searchPos = matchIndex + normalizedQuery.length
  }

  if (lastOrigIdx < chars.length) {
    segments.push({
      text: chars.slice(lastOrigIdx).join(''),
      highlighted: false,
    })
  }

  return segments.length > 0 ? segments : [{ text, highlighted: false }]
}
