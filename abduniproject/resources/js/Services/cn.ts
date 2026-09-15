// مساعد دمج الفئات — يوحّد منطق Tailwind عبر النظام
// يمنع التكرار ويضمن قابلية الصيانة — تغيير واحد يحدّث كل المكونات
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
