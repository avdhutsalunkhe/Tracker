import React, { useState } from 'react';
import { Modal } from '../common/Modal';

interface GateCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GateCalculatorModal: React.FC<GateCalculatorModalProps> = ({ isOpen, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [degMode, setDegMode] = useState(true);
  const [memory, setMemory] = useState<number>(0);

  const append = (val: string) => {
    setDisplay((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
  };

  const clearAll = () => {
    setDisplay('0');
    setExpression('');
  };

  const backspace = () => {
    setDisplay((prev) => (prev.length <= 1 || prev === 'Error' ? '0' : prev.slice(0, -1)));
  };

  const applyUnary = (fn: (x: number) => number, label: string) => {
    const num = parseFloat(display);
    if (Number.isNaN(num)) {
      setDisplay('Error');
      return;
    }
    const res = fn(num);
    if (!Number.isFinite(res)) {
      setDisplay('Error');
      return;
    }
    setExpression(`${label}(${num})`);
    setDisplay(String(Number(res.toPrecision(10))));
  };

  const evaluate = () => {
    try {
      const sanitized = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, String(Math.PI))
        .replace(/\be\b/g, String(Math.E))
        .replace(/\^/g, '**');
      // Safe math-only evaluation
      if (!/^[0-9+\-*/().\sE**]+$/.test(sanitized)) {
        setDisplay('Error');
        return;
      }
      const fn = new Function(`return (${sanitized})`);
      const res = Number(fn());
      if (!Number.isFinite(res)) {
        setDisplay('Error');
        return;
      }
      setExpression(`${display} =`);
      setDisplay(String(Number(res.toPrecision(10))));
    } catch {
      setDisplay('Error');
    }
  };

  const toRad = (x: number) => (degMode ? (x * Math.PI) / 180 : x);
  const fromRad = (x: number) => (degMode ? (x * 180) / Math.PI : x);

  const sciButtons: Array<{ label: string; onClick: () => void }> = [
    { label: degMode ? 'DEG' : 'RAD', onClick: () => setDegMode(!degMode) },
    { label: 'sin', onClick: () => applyUnary((x) => Math.sin(toRad(x)), 'sin') },
    { label: 'cos', onClick: () => applyUnary((x) => Math.cos(toRad(x)), 'cos') },
    { label: 'tan', onClick: () => applyUnary((x) => Math.tan(toRad(x)), 'tan') },
    { label: 'asin', onClick: () => applyUnary((x) => fromRad(Math.asin(x)), 'asin') },
    { label: 'acos', onClick: () => applyUnary((x) => fromRad(Math.acos(x)), 'acos') },
    { label: 'atan', onClick: () => applyUnary((x) => fromRad(Math.atan(x)), 'atan') },
    { label: 'ln', onClick: () => applyUnary((x) => Math.log(x), 'ln') },
    { label: 'log10', onClick: () => applyUnary((x) => Math.log10(x), 'log') },
    { label: 'e^x', onClick: () => applyUnary((x) => Math.exp(x), 'exp') },
    { label: 'x^2', onClick: () => applyUnary((x) => x * x, 'sq') },
    { label: 'sqrt', onClick: () => applyUnary((x) => Math.sqrt(x), 'sqrt') },
    { label: '1/x', onClick: () => applyUnary((x) => 1 / x, 'inv') },
    { label: 'n!', onClick: () => applyUnary((n) => {
      if (n < 0 || n > 170 || !Number.isInteger(n)) return NaN;
      let r = 1;
      for (let i = 2; i <= n; i++) r *= i;
      return r;
    }, 'fact') },
    { label: 'π', onClick: () => append(String(Number(Math.PI.toFixed(8)))) },
    { label: 'x^y', onClick: () => append('^') },
  ];

  const mainButtons = [
    'MC', 'MR', 'M+', 'C',
    '7', '8', '9', '÷',
    '4', '5', '6', '×',
    '1', '2', '3', '-',
    '0', '.', '(', '+',
  ];

  const handleMainBtn = (b: string) => {
    if (b === 'C') clearAll();
    else if (b === 'MC') setMemory(0);
    else if (b === 'MR') append(String(memory));
    else if (b === 'M+') setMemory((m) => m + (parseFloat(display) || 0));
    else append(b);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="GATE Virtual Scientific Calculator"
      subtitle="Practice with TCS iON-style online exam calculator constraints."
      maxWidth="max-w-md"
    >
      <div className="space-y-3 select-none">
        {/* Display */}
        <div className="p-3.5 rounded-xl bg-slate-900 text-right border border-slate-700">
          <div className="text-[11px] font-mono text-slate-400 h-4 truncate tabular-nums">
            {expression}
          </div>
          <div className="text-2xl font-mono font-bold text-white truncate tabular-nums mt-0.5">
            {display}
          </div>
        </div>

        {/* Scientific Row */}
        <div className="grid grid-cols-4 gap-1.5">
          {sciButtons.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={b.onClick}
              className="py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Main Keypad */}
        <div className="grid grid-cols-4 gap-1.5">
          {mainButtons.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => handleMainBtn(b)}
              className={`py-2.5 rounded-xl text-sm font-bold transition-colors tabular-nums ${
                ['÷', '×', '-', '+'].includes(b)
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100'
                  : b === 'C'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                  : 'bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {b}
            </button>
          ))}
        </div>

        {/* Bottom Row: ), Backspace, = */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={() => append(')')}
            className="py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 text-sm font-bold"
          >
            )
          </button>
          <button
            type="button"
            onClick={backspace}
            className="py-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold"
          >
            DEL
          </button>
          <button
            type="button"
            onClick={evaluate}
            className="col-span-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-xs"
          >
            =
          </button>
        </div>
      </div>
    </Modal>
  );
};
