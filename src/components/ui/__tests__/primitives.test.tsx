import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { TextPosition } from '../../../types';
import { Chip, PositionGrid, Segment, Switch } from '../index';

type Mode = 'solid' | 'linear' | 'radial';

const MODES = [
  { value: 'solid' as const, label: 'Solid' },
  { value: 'linear' as const, label: 'Linear' },
  { value: 'radial' as const, label: 'Radial' },
];

function StatefulSegment({ onChange }: { onChange?: (v: Mode) => void }) {
  const [value, setValue] = useState<Mode>('solid');
  return (
    <Segment
      label="Border style"
      value={value}
      options={MODES}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe('Segment', () => {
  it('exposes radiogroup semantics and a single roving tab stop', () => {
    render(<StatefulSegment />);
    const group = screen.getByRole('radiogroup', { name: 'Border style' });
    const radios = screen.getAllByRole('radio');

    expect(group).toBeDefined();
    expect(radios).toHaveLength(3);
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false']);
    expect(radios.map((r) => r.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('produces the same state change from the keyboard as from the pointer', () => {
    const fromKeyboard = vi.fn();
    const { unmount } = render(<StatefulSegment onChange={fromKeyboard} />);
    fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'ArrowRight' });
    expect(fromKeyboard).toHaveBeenCalledWith('linear');
    expect(screen.getByRole('radio', { checked: true }).textContent).toBe('Linear');
    unmount();

    const fromPointer = vi.fn();
    render(<StatefulSegment onChange={fromPointer} />);
    fireEvent.click(screen.getAllByRole('radio')[1]);
    expect(fromPointer).toHaveBeenCalledWith('linear');
    expect(screen.getByRole('radio', { checked: true }).textContent).toBe('Linear');
  });

  it('wraps with the arrow keys and jumps with Home/End', () => {
    render(<StatefulSegment />);
    const radios = screen.getAllByRole('radio');

    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' });
    expect(screen.getByRole('radio', { checked: true }).textContent).toBe('Radial');

    fireEvent.keyDown(radios[2], { key: 'Home' });
    expect(screen.getByRole('radio', { checked: true }).textContent).toBe('Solid');

    fireEvent.keyDown(radios[0], { key: 'End' });
    expect(screen.getByRole('radio', { checked: true }).textContent).toBe('Radial');
  });

  it('skips disabled options and keeps the group tabbable', () => {
    // Mirrors the font-weight call site: the value comes from typed state, so
    // the generic resolves to `number` and the options carry no annotation.
    const onChange = vi.fn();
    function WeightHarness() {
      const [weight, setWeight] = useState(400);
      return (
        <Segment
          label="Font weight"
          value={weight}
          options={[
            { value: 400, label: 'Regular' },
            { value: 500, label: 'Medium', disabled: true },
            { value: 700, label: 'Bold' },
          ]}
          onChange={(next) => {
            setWeight(next);
            onChange(next);
          }}
        />
      );
    }
    render(<WeightHarness />);
    fireEvent.keyDown(screen.getAllByRole('radio')[0], { key: 'ArrowRight' });
    expect(onChange).toHaveBeenCalledWith(700);
  });

  it('leaves the tab order when every option is disabled', () => {
    function SingleWeight() {
      const [weight, setWeight] = useState(400);
      return (
        <Segment
          label="Font weight"
          value={weight}
          options={[{ value: 400, label: 'Regular', disabled: true }]}
          onChange={setWeight}
        />
      );
    }
    render(<SingleWeight />);
    expect(screen.getAllByRole('radio')[0].getAttribute('tabindex')).toBe('-1');
  });
});

describe('Chip', () => {
  it('reports aria-pressed only when it is selectable', () => {
    render(
      <>
        <Chip selected onClick={vi.fn()}>
          White 3%
        </Chip>
        <Chip selected={false} onClick={vi.fn()}>
          Black 5%
        </Chip>
        <Chip onClick={vi.fn()}>Today&apos;s Date</Chip>
      </>,
    );
    expect(screen.getByRole('button', { name: 'White 3%' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('button', { name: 'Black 5%' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('button', { name: "Today's Date" }).hasAttribute('aria-pressed')).toBe(false);
  });
});

describe('Switch', () => {
  it('toggles on activation and reports its state', () => {
    function Harness() {
      const [on, setOn] = useState(false);
      return <Switch label="Checkerboard" checked={on} onChange={setOn} />;
    }
    render(<Harness />);
    const control = screen.getByRole('switch', { name: 'Checkerboard' });

    expect(control.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(control);
    expect(control.getAttribute('aria-checked')).toBe('true');
    // Space on a native button fires a click, which is the same path.
    fireEvent.click(control, { detail: 0 });
    expect(control.getAttribute('aria-checked')).toBe('false');
  });
});

describe('PositionGrid', () => {
  function Harness({ start = 'middle-center' as TextPosition }) {
    const [value, setValue] = useState<TextPosition>(start);
    return <PositionGrid label="Position" value={value} onChange={setValue} />;
  }

  it('puts nine radios directly under one radiogroup', () => {
    render(<Harness />);
    const group = screen.getByRole('radiogroup', { name: 'Position' });
    const radios = screen.getAllByRole('radio');
    expect(radios).toHaveLength(9);
    expect(radios.every((radio) => radio.parentElement === group)).toBe(true);
    expect(screen.getByRole('radio', { checked: true }).getAttribute('aria-label')).toBe('Middle center');
  });

  it('moves in two dimensions and clamps at the edges', () => {
    render(<Harness />);
    const cell = () => screen.getByRole('radio', { checked: true });

    fireEvent.keyDown(cell(), { key: 'ArrowUp' });
    expect(cell().getAttribute('aria-label')).toBe('Top center');

    fireEvent.keyDown(cell(), { key: 'ArrowUp' });
    expect(cell().getAttribute('aria-label')).toBe('Top center');

    fireEvent.keyDown(cell(), { key: 'ArrowRight' });
    expect(cell().getAttribute('aria-label')).toBe('Top right');

    fireEvent.keyDown(cell(), { key: 'ArrowRight' });
    expect(cell().getAttribute('aria-label')).toBe('Top right');

    fireEvent.keyDown(cell(), { key: 'ArrowDown' });
    expect(cell().getAttribute('aria-label')).toBe('Middle right');

    fireEvent.keyDown(cell(), { key: 'Home' });
    expect(cell().getAttribute('aria-label')).toBe('Middle left');

    fireEvent.keyDown(cell(), { key: 'End', ctrlKey: true });
    expect(cell().getAttribute('aria-label')).toBe('Bottom right');
  });
});
