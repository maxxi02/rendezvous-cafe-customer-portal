'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useLenisRef } from '@/app/providers/LenisProvider';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Max width class, defaults to max-w-lg */
  maxWidth?: string;
  /** Hide the default close button */
  hideClose?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'max-w-lg',
  hideClose = false,
}: ModalProps) {
  const lenisRef = useLenisRef();
  const contentRef = useRef<HTMLDivElement>(null);

  // Stop/start Lenis and lock body scroll when modal opens
  useEffect(() => {
    if (isOpen) {
      lenisRef.current?.stop();
      document.body.style.overflow = 'hidden';
    } else {
      lenisRef.current?.start();
      document.body.style.overflow = '';
    }
    return () => {
      lenisRef.current?.start();
      document.body.style.overflow = '';
    };
  }, [isOpen, lenisRef]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={contentRef}
        data-lenis-prevent
        className={[
          'relative z-10 w-full flex flex-col',
          maxWidth,
          'max-h-[90dvh]',
          'bg-background rounded-2xl border border-white/10 shadow-2xl shadow-black/50',
          'overflow-hidden',
        ].join(' ')}
      >
        {/* Merlot accent bar */}
        <div className="h-1 w-full bg-primary shrink-0" />

        {/* Header */}
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-2 shrink-0">
            <div>
              {title && (
                <h2 className="text-lg font-semibold leading-tight">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
              )}
            </div>
            {!hideClose && (
              <button
                onClick={onClose}
                aria-label="Close"
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}

        {/* Scrollable body */}
        {children && (
          <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-4">
            {children}
          </div>
        )}

        {/* Footer */}
        {footer && (
          <div className="shrink-0 px-6 py-4 border-t border-border flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
