import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { DropZone } from '../DropZone';

describe('DropZone file picker accessibility', () => {
  test('keeps the native file input out of the tab order in the empty state', () => {
    const { container } = render(<DropZone onFilesSelected={vi.fn()} />);

    const input = container.querySelector('input[type="file"]');
    const trigger = screen.getByLabelText('Drop images here, or click to browse', { selector: 'label' });

    expect(input?.getAttribute('class')).toBe('hidden');
    expect(input?.getAttribute('tabindex')).toBe('-1');
    expect(trigger.getAttribute('tabindex')).toBe('0');
    expect(trigger.getAttribute('aria-describedby')).toBeTruthy();
  });

  test('keeps the native file input out of the tab order in the add-more state', () => {
    const { container } = render(<DropZone onFilesSelected={vi.fn()} hasImages />);

    const input = container.querySelector('input[type="file"]');
    const trigger = screen.getByLabelText('Add more images', { selector: 'label' });

    expect(input?.getAttribute('class')).toBe('hidden');
    expect(input?.getAttribute('tabindex')).toBe('-1');
    expect(trigger.getAttribute('tabindex')).toBe('0');
    expect(trigger.getAttribute('aria-describedby')).toBeTruthy();
  });
});
