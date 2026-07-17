/** Fiyatı restoranın kendi para birimiyle biçimlendirir. */
export function formatPrice(amount: number, currency = "TRY", locale = "tr-TR"): string {
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    // Intl tanımadığı bir para birimi kodunda hata fırlatır. Veritabanı sadece
    // uzunluğu kontrol ettiği için 3 karakterlik geçersiz bir kod buraya ulaşabilir.
    return `${amount.toFixed(2)} ${currency}`;
  }
}
