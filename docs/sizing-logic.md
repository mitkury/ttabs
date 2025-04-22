# Sizing Logic in ttabs

## Overview

ttabs uses a flexible sizing system that supports multiple unit types and automatically handles space distribution. This document explains how sizing works in ttabs and the logic behind layout calculations.

## Supported Size Units

The layout system supports three types of size units:

- **Percentage (`%`)**: Relative to the parent container's size
- **Pixels (`px`)**: Fixed size in pixels
- **Auto (`auto`)**: Takes remaining space after fixed and percentage-based elements

## How Sizing Works

### Size Representation

Internally, sizes are represented as a `SizeInfo` object:

```typescript
{ value: number; unit: 'px' | '%' | 'auto' }
```

### Size Distribution Logic

When rendering the layout, ttabs follows these rules:

1. Fixed-size (`px`) elements are allocated first
2. If fixed elements exceed container size, they're scaled down proportionally
3. Percentage-based (`%`) elements get their specified portion of remaining space
4. Any remaining space is distributed among `auto` elements

### Adding New Elements

When adding a new row or column, ttabs intelligently handles sizing:

1. **First element** in a container gets 100% of the available space
2. **Adding with default (auto) sizing**:
   - If container has percentage-based elements, percentages are redistributed evenly
   - For example, if adding a third row to two 50% rows, all three become 33.33%
   - Fixed-size elements are preserved, and auto elements adjust accordingly
3. **Adding with explicit sizing**:
   - The specified size is used directly
   - Layout is recalculated to ensure proper rendering

### Recalculation and Redistribution

ttabs automatically recalculates the layout in these scenarios:

1. **When adding elements**: Ensures proper space distribution
2. **When removing elements**: Redistributes space to siblings
3. **During resize operations**: Maintains proportions and constraints

## Best Practices

- **Use percentages** for most elements to create proportional layouts
- **Use fixed sizes** sparingly, for elements that should maintain specific dimensions
- **Use auto sizing** when an element should flexibly fill available space
- **Let ttabs handle redistribution** rather than manually setting sizes after changes

## Special Cases

- When percentages exceed 100%, they're normalized proportionally
- Minimum size constraints prevent elements from collapsing
- Empty containers are automatically cleaned up
- DOM-based calculations ensure accurate rendering

## Example Scenarios

- **Equal distribution**: Adding elements with default sizing creates equally sized elements
- **Mixed units**: Adding a percentage-based element to fixed-size elements respects fixed sizes
- **Adding to auto elements**: New elements also get auto sizing for consistent behavior 