// تأكيد بالضغط المطوّل — 2 ثانية — للعمليات عالية المخاطر (Kill-Switch / إلغاء جماعي)
// Phase 4.0 Part 2: Hold-to-confirm — ESC + backdrop blur + شريط تقدم + RBAC
import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  holdMs?: number;
  variant?: "danger" | "gold" | "ai-action";
  requiredPermission?: string;
  onConfirm: () => void | Promise<void>;
}

export default function ConfirmHoldModal({ open, onOpenChange, title, description, confirmLabel = "اضغط مطوّلاً للتأكيد — 2 ثانية", holdMs = 2000, variant = "danger", requiredPermission, onConfirm }: Props) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (!open) {
      setProgress(0);
      setHolding(false);
      if (timerRef.current) window.clearInterval(timerRef.current);
    }
  }, [open]);

  const start = (): void => {
    setHolding(true);
    startRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / holdMs) * 100);
      setProgress(pct);
      if (pct >= 100) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        setHolding(false);
        setProgress(0);
        void onConfirm();
        onOpenChange(false);
      }
    }, 16);
  };

  const stop = (): void => {
    setHolding(false);
    setProgress(0);
    if (timerRef.current) window.clearInterval(timerRef.current);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <div className="space-y-4">
        <p className="text-body text-[var(--text-secondary)]">هذه العملية عالية المخاطر — لا يمكن التراجع. اضغط مطوّلاً لتأكيد التنفيذ.</p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-secondary)]">
          <div className="h-full bg-[var(--brand-crimson)] transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            variant={variant === "gold" ? "gold" : variant === "ai-action" ? "ai-action" : "danger"}
            requiredPermission={requiredPermission}
            onPointerDown={start}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
          >
            {holding ? `${Math.round(progress)}%` : confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
