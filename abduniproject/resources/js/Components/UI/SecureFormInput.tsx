// حقل آمن — يطمس الهاتف والبريد والروابط تلقائياً أثناء الكتابة
// Phase 4.0 Part 2: SecureFormInput + RegexDataLeakDetector — Pillar 5
import { useCallback } from "react";
import FormInput, { type FormInputProps } from "./FormInput";
import { maskLeak } from "@/Utils/sanitize";

export interface SecureFormInputProps extends FormInputProps {}

export default function SecureFormInput({ onChange, value, ...props }: SecureFormInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;
      const masked = maskLeak(e.target.value);
      if (masked !== e.target.value) {
        const next = { ...e, target: { ...e.target, value: masked } } as React.ChangeEvent<HTMLInputElement>;
        onChange(next);
        return;
      }
      onChange(e);
    },
    [onChange],
  );

  return <FormInput {...props} value={value} onChange={handleChange} autoComplete="off" spellCheck={false} />;
}
