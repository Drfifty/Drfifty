// صندوق الرمل الحي — عرض كل بدائيات Part 1 & 2 — يُحدّث تراكمياً مع كل Part
// Phase 4.0 Dev Utility — /dev/sandbox — تفاعلي + RTL + توكنات + Inertia
import { useState } from "react";
import AppLayout from "@/Layouts/AppLayout";
import Button from "@/Components/UI/Button";
import FormInput from "@/Components/UI/FormInput";
import SecureFormInput from "@/Components/UI/SecureFormInput";
import DynamicTable from "@/Components/UI/DynamicTable";
import Modal from "@/Components/UI/Modal";
import ConfirmHoldModal from "@/Components/UI/ConfirmHoldModal";
import StatusBadge from "@/Components/UI/StatusBadge";
import MultiTenantSwitcher from "@/Components/UI/MultiTenantSwitcher";
import ErrorBoundary from "@/Components/UI/ErrorBoundary";
import type { Paginated } from "@/Types";

type Row = { id: number; name: string; amount_minor: number; status: "Verified" | "Pending" | "Danger" | "VIP" | "Anonymous" | "AI_Active" };

const mockRows: Paginated<Row> = {
  data: [
    { id: 1, name: "فاتورة #001 — صيدلية", amount_minor: 125000, status: "Verified" },
    { id: 2, name: "فاتورة #002 — معمل", amount_minor: 89000, status: "Pending" },
    { id: 3, name: "فاتورة #003 — توريد", amount_minor: 450000, status: "AI_Active" },
  ],
  current_page: 1,
  last_page: 2,
  per_page: 10,
  total: 3,
  links: [
    { url: null, label: "&laquo; السابق", active: false },
    { url: "/dev/sandbox?page=1", label: "1", active: true },
    { url: "/dev/sandbox?page=2", label: "2", active: false },
    { url: "/dev/sandbox?page=2", label: "التالي &raquo;", active: false },
  ],
};

function Thrower({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("Simulated crash — ErrorBoundary caught ✓");
  return <p className="text-body text-[var(--text-secondary)]">محتوى آمن — اضغط الزر لمحاكاة انهيار.</p>;
}

export default function Sandbox() {
  const [modalOpen, setModalOpen] = useState(false);
  const [holdOpen, setHoldOpen] = useState(false);
  const [secureVal, setSecureVal] = useState("01012345678 test@example.com https://evil.com");
  const [selected, setSelected] = useState<(string | number)[]>([1]);
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [throwOn, setThrowOn] = useState(false);
  const [formVal, setFormVal] = useState("");

  const handleSort = (k: string): void => {
    if (sortKey === k) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(k);
      setSortDir("asc");
    }
  };

  return (
    <AppLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="glass-outer rounded-[var(--radius-lg)] p-6">
          <h1 className="text-title font-bold text-white">Sandbox — Phase 4.0 Living Showcase</h1>
          <p className="mt-2 text-body text-[var(--text-secondary)]">عرض حي تراكمي — Part 1 & 2: Atomic Primitives — يُحدّث مع كل Part (Part 3 HQ → Part 4 AU BUSINESS …)</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-[var(--brand-gold)] px-3 py-1 text-micro font-bold text-black">Part 1 & 2: Atomic</span>
            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-micro text-[var(--text-secondary)]">Part 3: HQ قادم</span>
            <span className="rounded-full bg-[var(--surface-secondary)] px-3 py-1 text-micro text-[var(--text-secondary)]">Part 4: AU BUSINESS قادم</span>
          </div>
        </div>

        <section className="glass-inner rounded-[var(--radius-lg)] p-5">
          <h2 className="text-section font-semibold text-[var(--text-on-pearl)]">Button — كل الأنماط + الحالات</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="primary">primary #0A0A0C</Button>
            <Button variant="secondary">secondary</Button>
            <Button variant="danger">danger #EF4444</Button>
            <Button variant="ai-action">ai-action #06B6D4</Button>
            <Button variant="gold">gold #C5A059</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="crimson">crimson</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button isLoading>isLoading</Button>
            <Button isDisabled>isDisabled</Button>
            <Button icon={<span>⚡</span>}>icon</Button>
            <Button requiredPermission="admin.delete">permission purge (مخفي إن بلا صلاحية)</Button>
            <Button appContext="AU MED">appContext AU MED</Button>
          </div>
        </section>

        <section className="glass-inner rounded-[var(--radius-lg)] p-5 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-section font-semibold text-[var(--text-on-pearl)]">FormInput — قياسي</h3>
            <FormInput label="البريد الإلكتروني" placeholder="name@domain.com" value={formVal} onChange={(e) => setFormVal(e.target.value)} helperText="RTL + توكنات + رسالة مساعدة" />
            <FormInput label="حقل بخطأ" error="هذا الحقل مطلوب" placeholder="خطأ" className="mt-3" />
          </div>
          <div>
            <h3 className="text-section font-semibold text-[var(--text-on-pearl)]">SecureFormInput — RegexDataLeakDetector حي</h3>
            <SecureFormInput label="هاتف / بريد / رابط — يُطمس تلقائياً" value={secureVal} onChange={(e) => setSecureVal(e.target.value)} helperText="جرّب: 01012345678 أو test@ex.com أو https://..." />
            <p className="mt-2 text-micro text-[var(--text-secondary)]">المخزن (مطمس): <span dir="ltr" className="font-mono">{secureVal}</span></p>
          </div>
        </section>

        <section className="glass-inner rounded-[var(--radius-lg)] p-5">
          <h2 className="text-section font-semibold text-[var(--text-on-pearl)]">DynamicTable — EGP minor-units + فرز + تحديد + إجراءات + شارات</h2>
          <div className="mt-4">
            <DynamicTable
              rows={mockRows}
              resource="/dev/sandbox"
              caption="جدول مالي تجريبي"
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
              selectable
              selectedIds={selected}
              onSelectionChange={setSelected}
              rowActions={[{ key: "view", label: "عرض", onClick: (r) => alert(`عرض ${r.name}`) }, { key: "danger", label: "حذف", permission: "admin.delete", onClick: (r) => alert(`حذف ${r.id}`) }]}
              columns={[
                { key: "name", label: "البيان", sortable: true },
                { key: "amount_minor", label: "المبلغ (EGP)", isMoney: true, align: "end", sortable: true },
                { key: "status", label: "الحالة", render: (r) => <StatusBadge state={r.status} /> },
              ]}
            />
          </div>
        </section>

        <section className="glass-inner rounded-[var(--radius-lg)] p-5">
          <h2 className="text-section font-semibold text-[var(--text-on-pearl)]">Modal & ConfirmHoldModal — ESC + blur</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => setModalOpen(true)}>افتح Modal</Button>
            <Button variant="danger" onClick={() => setHoldOpen(true)}>افتح ConfirmHold (2s)</Button>
          </div>
          <Modal open={modalOpen} onOpenChange={setModalOpen} title="نافذة عادية" description="ESC أو الخلفية للإغلاق — blur 8px + قفل تمرير">
            <p className="text-body text-[var(--text-secondary)]">محتوى تجريبي — أزرار ديناميكية:</p>
            <div className="mt-4 flex justify-end gap-2"><Button variant="secondary" onClick={() => setModalOpen(false)}>إغلاق</Button><Button onClick={() => setModalOpen(false)}>تأكيد</Button></div>
          </Modal>
          <ConfirmHoldModal open={holdOpen} onOpenChange={setHoldOpen} title="تأكيد عالي المخاطر" description="Kill-Switch / إلغاء جماعي — اضغط مطوّلاً 2 ثانية" onConfirm={() => alert("تم التأكيد بعد 2 ثانية ✓")} variant="danger" />
        </section>

        <section className="glass-inner rounded-[var(--radius-lg)] p-5">
          <h2 className="text-section font-semibold text-[var(--text-on-pearl)]">StatusBadge — كل الحالات الست</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusBadge state="Verified" dot />
            <StatusBadge state="Pending" dot />
            <StatusBadge state="Danger" dot />
            <StatusBadge state="VIP" dot />
            <StatusBadge state="Anonymous" dot />
            <StatusBadge state="AI_Active" dot />
          </div>
        </section>

        <section className="glass-inner rounded-[var(--radius-lg)] p-5">
          <h2 className="text-section font-semibold text-[var(--text-on-pearl)]">MultiTenantSwitcher — 6 سياقات</h2>
          <div className="mt-4"><MultiTenantSwitcher /></div>
          <p className="mt-2 text-micro text-[var(--text-secondary)]">يبدّل `app_id` عبر `router.visit` — MASTER_HQ → /admin — البقية → /switch?app_id=</p>
        </section>

        <section className="glass-inner rounded-[var(--radius-lg)] p-5">
          <h2 className="text-section font-semibold text-[var(--text-on-pearl)]">ErrorBoundary — حماية الانهيار + إخفاء Stack</h2>
          <ErrorBoundary>
            <div className="mt-3 rounded-[var(--radius-md)] border border-[var(--border-pearl)] bg-[var(--surface-pearl-strong)] p-4">
              <Thrower shouldThrow={throwOn} />
              <div className="mt-3 flex gap-2">
                <Button variant="secondary" onClick={() => setThrowOn((v) => !v)}>{throwOn ? "إصلاح" : "محاكاة انهيار"}</Button>
                <Button variant="ghost" onClick={() => setThrowOn(false)}>إعادة تعيين</Button>
              </div>
            </div>
          </ErrorBoundary>
        </section>

        <div className="text-center text-micro text-[var(--text-secondary)]">Sandbox تراكمي — سيُضاف Part 3 HQ / Part 4 AU BUSINESS تلقائياً في نفس الصفحة</div>
      </div>
    </AppLayout>
  );
}
