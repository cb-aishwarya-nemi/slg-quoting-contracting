import type { LabelValue } from '@/data/contractProcessingMock'

export function applyFieldValue(
  items: LabelValue[],
  label: string,
  newValue: string
): LabelValue[] {
  return items.map((item) =>
    item.label === label
      ? {
          ...item,
          value: newValue,
          extractionFailed: newValue.trim() ? false : item.extractionFailed,
        }
      : item
  )
}

export function countUnresolvedExtractionItems(items: LabelValue[]): number {
  return items.filter((item) => item.extractionFailed && !item.value.trim()).length
}

export function getExtractionAttentionStatus(items: LabelValue[]) {
  const unresolvedCount = countUnresolvedExtractionItems(items)

  if (unresolvedCount === 0) {
    return { status: 'ready' as const, statusLabel: 'Ready' }
  }

  return {
    status: 'attention' as const,
    statusLabel: `${unresolvedCount} ${unresolvedCount === 1 ? 'item needs' : 'items need'} action · not found in contract`,
  }
}
