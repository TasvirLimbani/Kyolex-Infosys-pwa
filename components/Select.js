'use client';
import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

// Dropdown drawn by the app itself. The phone's own <select> popup opens in the wrong place
// inside the bottom sheet, so the list is rendered here, right under the field.
// options: [{ value, label }]. onChange gets { target: { value } } like a native select.
export default function Select({ value, onChange, options, placeholder = 'Select', required, label }) {
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const list = useRef(null);
  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    list.current?.scrollIntoView({ block: 'nearest' });
    const outside = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  function pick(v) {
    setOpen(false);
    if (v !== value) onChange({ target: { value: v } });
  }

  function onKeyDown(e) {
    if (e.key !== 'Escape' || !open) return;
    e.nativeEvent.stopImmediatePropagation(); // close the list, not the whole modal
    e.stopPropagation();
    setOpen(false);
  }

  return (
    <div className="select" ref={box} onKeyDown={onKeyDown}>
      <button type="button" className={`select-btn ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open} aria-label={label}>
        <span className={current ? '' : 'select-empty'}>{current ? current.label : placeholder}</span>
        <Icon name="down" size={18} />
      </button>
      {/* keeps the browser's own "fill in this field" check working */}
      {required && <input className="select-check" tabIndex={-1} aria-hidden="true" required value={value} onChange={() => {}} onFocus={() => setOpen(true)} />}
      {open && (
        <div className="select-list" role="listbox" ref={list}>
          {options.map((o) => (
            <button type="button" key={o.value} role="option" aria-selected={o.value === value}
              className={`select-item ${o.value === value ? 'on' : ''}`} onClick={() => pick(o.value)}>
              {o.label}
            </button>
          ))}
          {options.length === 0 && <p className="select-none">Nothing to pick yet.</p>}
        </div>
      )}
    </div>
  );
}
