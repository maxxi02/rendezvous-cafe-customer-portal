'use client';

import { useState, useCallback, useEffect } from 'react';
import { X, Check, Plus, Minus, Sparkles } from 'lucide-react';
import { SelectedAddon } from '@/app/types/order.type';
import { useLenisRef } from '@/app/providers/LenisProvider';

interface AddonItem {
  name: string;
  price: number;
}

interface AddonGroup {
  name: string;
  required: boolean;
  multiSelect: boolean;
  items: AddonItem[];
}

interface AddonModalProduct {
  _id: string;
  name: string;
  price: number;
  description?: string;
  imageUrl?: string;
  addonGroups: AddonGroup[];
}

interface AddonModalProps {
  product: AddonModalProduct | null;
  open: boolean;
  onClose: () => void;
  /** Called when customer confirms with selected addons (may be empty if skipped) */
  onConfirm: (product: AddonModalProduct, selectedAddons: SelectedAddon[], quantity: number) => void;
}

export function AddonModal({ product, open, onClose, onConfirm }: AddonModalProps) {
  const [selections, setSelections] = useState<Record<string, Set<string>>>({});
  const [quantity, setQuantity] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const lenisRef = useLenisRef();

  // Animate in/out
  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
      lenisRef.current?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      setVisible(false);
      const t = setTimeout(() => {
        setMounted(false);
        lenisRef.current?.start();
        document.body.style.overflow = '';
      }, 350);
      return () => clearTimeout(t);
    }
  }, [open, lenisRef]);

  const handleClose = useCallback(() => {
    setSelections({});
    setQuantity(1);
    onClose();
  }, [onClose]);

  if (!product || !mounted) return null;

  const groups: AddonGroup[] = product.addonGroups || [];

  const toggleAddon = (group: AddonGroup, itemName: string) => {
    setSelections(prev => {
      const current = new Set(prev[group.name] || []);
      if (group.multiSelect) {
        current.has(itemName) ? current.delete(itemName) : current.add(itemName);
      } else {
        current.clear();
        current.add(itemName);
      }
      return { ...prev, [group.name]: new Set(current) };
    });
  };

  const isSelected = (groupName: string, itemName: string) =>
    (selections[groupName] || new Set()).has(itemName);

  const selectedAddonList: SelectedAddon[] = groups.flatMap(group =>
    group.items
      .filter(item => isSelected(group.name, item.name))
      .map(item => ({ groupName: group.name, addonName: item.name, price: item.price }))
  );

  const addonTotal = selectedAddonList.reduce((s, a) => s + a.price, 0);
  const lineTotal = (product.price + addonTotal) * quantity;

  const missingRequired = groups.filter(g => g.required && !(selections[g.name]?.size));

  const handleConfirm = () => {
    if (missingRequired.length > 0) return;
    onConfirm(product, selectedAddonList, quantity);
    setSelections({});
    setQuantity(1);
  };

  const handleSkip = () => {
    onConfirm(product, [], quantity);
    setSelections({});
    setQuantity(1);
  };

  const hasRequired = groups.some(g => g.required);

  return (
    <div
      className="fixed inset-0 z-60 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{
        transition: 'opacity 0.35s ease, backdrop-filter 0.35s ease',
        opacity: visible ? 1 : 0,
        backdropFilter: visible ? 'blur(18px) brightness(0.35)' : 'blur(0px) brightness(1)',
        background: visible ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0)',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-[#0f0a06] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{
          maxHeight: '90dvh',
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1), opacity 0.35s ease',
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(40px) scale(0.96)',
          opacity: visible ? 1 : 0,
          border: '1.5px solid rgba(232,98,26,0.25)',
          boxShadow: '0 0 80px -10px rgba(232,98,26,0.35)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-start gap-4 px-5 pt-4 pb-4 border-b border-white/8 shrink-0">
          {product.imageUrl && (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="h-14 w-14 rounded-2xl object-cover border border-white/10 shrink-0"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">Customize</span>
            </div>
            <h2 className="font-black uppercase tracking-wide text-white text-sm sm:text-base leading-tight mt-0.5 line-clamp-2">
              {product.name}
            </h2>
            <p className="text-primary font-black text-sm mt-1">
              ₱{product.price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="h-8 w-8 rounded-full bg-white/8 flex items-center justify-center text-white/60 hover:bg-white/15 active:scale-95 transition-all shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Addon Groups — scrollable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-5">
          {groups.map(group => {
            const isMissing = group.required && !(selections[group.name]?.size);
            return (
              <div key={group.name}>
                {/* Group label */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="font-black uppercase tracking-widest text-white text-[11px]">
                    {group.name}
                  </span>
                  {group.required ? (
                    <span
                      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border transition-all ${
                        isMissing
                          ? 'border-red-500/60 text-red-400 bg-red-500/10 animate-pulse'
                          : 'border-green-500/40 text-green-400 bg-green-500/8'
                      }`}
                    >
                      {isMissing ? 'Required' : '✓ Selected'}
                    </span>
                  ) : (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/15 text-white/40">
                      Optional
                    </span>
                  )}
                  {group.multiSelect && (
                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/10 text-white/30">
                      Multi
                    </span>
                  )}
                </div>

                {/* Items */}
                <div className="grid grid-cols-1 gap-2">
                  {group.items.map(item => {
                    const selected = isSelected(group.name, item.name);
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => toggleAddon(group, item.name)}
                        className={`flex items-center justify-between w-full px-4 py-3 rounded-2xl border text-left transition-all duration-200 touch-manipulation active:scale-98 ${
                          selected
                            ? 'border-primary/60 bg-primary/10'
                            : 'border-white/8 bg-white/3 hover:border-white/20 hover:bg-white/6'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-200 ${
                              selected ? 'border-primary bg-primary' : 'border-white/25'
                            }`}
                          >
                            {selected && <Check className="w-2.5 h-2.5 text-black" strokeWidth={3} />}
                          </div>
                          <span className={`text-sm font-bold uppercase tracking-wide truncate transition-colors ${selected ? 'text-white' : 'text-white/70'}`}>
                            {item.name}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-black shrink-0 ml-2 transition-colors ${
                            item.price === 0
                              ? 'text-white/30'
                              : selected
                              ? 'text-primary'
                              : 'text-white/50'
                          }`}
                        >
                          {item.price === 0 ? 'Free' : `+₱${item.price.toFixed(2)}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/8 space-y-3 shrink-0 bg-[#0f0a06]">
          {/* Quantity + total row */}
          <div className="flex items-center justify-between">
            {/* Quantity stepper */}
            <div className="flex items-center gap-2 bg-white/6 rounded-full px-1 py-1">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="h-8 w-8 rounded-full bg-white/8 flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition-all touch-manipulation"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-7 text-center font-black text-white text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => q + 1)}
                className="h-8 w-8 rounded-full bg-white/8 flex items-center justify-center text-white hover:bg-white/15 active:scale-95 transition-all touch-manipulation"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Running total */}
            <div className="text-right">
              <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Total</p>
              <p className="text-lg font-black text-primary leading-tight">
                ₱{lineTotal.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            {/* Skip (only for fully optional sets) */}
            {!hasRequired && (
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-3 rounded-2xl font-black text-xs uppercase tracking-widest border border-white/15 text-white/60 hover:bg-white/8 active:scale-95 transition-all touch-manipulation"
              >
                No Add-ons
              </button>
            )}
            <button
              type="button"
              disabled={missingRequired.length > 0}
              onClick={handleConfirm}
              className={`py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 touch-manipulation ${
                hasRequired ? 'flex-1' : 'flex-2'
              } ${
                missingRequired.length > 0
                  ? 'bg-white/10 text-white/30 cursor-not-allowed'
                  : 'bg-primary text-black hover:bg-white active:scale-95 shadow-lg shadow-primary/25'
              }`}
            >
              {missingRequired.length > 0
                ? `Select ${missingRequired[0].name}`
                : `Add to Cart · ₱${lineTotal.toFixed(2)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
