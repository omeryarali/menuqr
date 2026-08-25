import type { Metadata } from "next";
import Link from "next/link";

import { QrCode } from "lucide-react";

import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve KVKK Aydınlatma Metni",
  description: "MenuQR gizlilik politikası ve KVKK kapsamında kişisel verilerin işlenmesine dair aydınlatma metni.",
};

/*
 * ⚠️ HUKUKİ NOT (yayına almadan önce oku):
 * Bu bir TASLAKTIR, hukuki tavsiye değildir. Yayına almadan önce:
 *   1. Aşağıdaki [KÖŞELİ PARANTEZ] alanlarını gerçek bilgilerinle doldur
 *      (işletme/veri sorumlusu adı, adres, iletişim e-postası, KEP vb.).
 *   2. Bir hukuk danışmanına / KVKK uzmanına kontrol ettir.
 * Metin, uygulamanın gerçek veri akışına göre yazıldı (Supabase, Vercel, Gmail
 * SMTP; e-posta + ad + restoran verisi) ama nihai sorumluluk sende.
 */

const LAST_UPDATED = "2026-07-19";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-foreground text-xl font-bold">{title}</h2>
      <div className="text-muted-foreground space-y-3 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold">
            <span className="bg-brand-gradient flex size-7 items-center justify-center rounded-lg text-white">
              <QrCode className="size-4" aria-hidden />
            </span>
            MenuQR
          </Link>
          <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">
            Ana sayfa
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 space-y-8 px-4 py-10 lg:px-8">
        <div className="space-y-2">
          <h1 className="font-display text-3xl font-bold text-balance">
            Gizlilik Politikası ve KVKK Aydınlatma Metni
          </h1>
          <p className="text-muted-foreground text-sm">Son güncelleme: {formatDate(LAST_UPDATED)}</p>
        </div>

        <Section title="1. Veri Sorumlusu">
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca kişisel
            verileriniz, veri sorumlusu sıfatıyla <strong>[İŞLETME / VERİ SORUMLUSU ADI]</strong>{" "}
            (&ldquo;MenuQR&rdquo;, &ldquo;biz&rdquo;) tarafından aşağıda açıklanan kapsamda işlenmektedir.
          </p>
          <p>
            Adres: <strong>[İŞLETME ADRESİ]</strong>
            <br />
            E-posta: <strong>[İLETİŞİM E-POSTASI]</strong>
          </p>
        </Section>

        <Section title="2. İşlenen Kişisel Veriler">
          <p>MenuQR hizmetini kullanırken aşağıdaki kişisel verileriniz işlenir:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Kimlik ve iletişim:</strong> ad soyad, e-posta adresi.
            </li>
            <li>
              <strong>Hesap ve güvenlik:</strong> şifreniz (geri döndürülemez şekilde şifrelenmiş olarak
              saklanır), oturum bilgileri, e-posta doğrulama durumu.
            </li>
            <li>
              <strong>İşletme/menü içeriği:</strong> oluşturduğunuz restoran adı, adresi, telefonu ve menü
              (kategori/ürün) bilgileri. Bu içeriği menünüzü yayınladığınızda kamuya açık hâle getirirsiniz.
            </li>
            <li>
              <strong>Teknik veriler:</strong> hizmetin çalışması için gerekli zorunlu çerezler (oturum) ve
              temel sunucu kayıtları.
            </li>
          </ul>
          <p>
            Restoranınızın <strong>müşterileri</strong>, yayınlanmış menüyü görüntülemek için hesap
            oluşturmaz; menü sayfasında ziyaretçilerden kişisel veri toplanmaz.
          </p>
        </Section>

        <Section title="3. Kişisel Verilerin İşlenme Amaçları">
          <ul className="list-disc space-y-1 pl-5">
            <li>Hesabınızı oluşturmak, kimliğinizi doğrulamak ve girişinizi sağlamak,</li>
            <li>QR menü oluşturma, düzenleme ve yayınlama hizmetini sunmak,</li>
            <li>Hesap güvenliğini sağlamak ve kötüye kullanımı önlemek,</li>
            <li>Şifre sıfırlama ve hesap doğrulama gibi işlemsel e-postaları göndermek,</li>
            <li>Yasal yükümlülüklerimizi yerine getirmek.</li>
          </ul>
        </Section>

        <Section title="4. İşlemenin Hukuki Sebepleri">
          <p>Kişisel verileriniz KVKK m.5 kapsamında şu hukuki sebeplere dayanılarak işlenir:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Bir sözleşmenin kurulması veya ifası için gerekli olması (hizmetin sunulması),</li>
            <li>Hukuki yükümlülüğün yerine getirilmesi,</li>
            <li>
              Temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatlerimiz (güvenlik,
              hizmetin iyileştirilmesi).
            </li>
          </ul>
        </Section>

        <Section title="5. Verilerin Aktarımı ve Yurt Dışına Aktarım">
          <p>
            Hizmetimiz, altyapı hizmetlerini yurt dışında sunucuları bulunan tedarikçiler (veri işleyenler)
            aracılığıyla sağlar. Bu nedenle kişisel verileriniz, hizmetin sunulması amacıyla aşağıdaki
            tedarikçilerin sunucularında işlenebilir ve yurt dışına aktarılabilir:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong> — veritabanı, kimlik doğrulama ve barındırma,
            </li>
            <li>
              <strong>Vercel</strong> — uygulama barındırma ve dağıtım,
            </li>
            <li>
              <strong>[E-POSTA SAĞLAYICISI — örn. Google / Gmail SMTP]</strong> — işlemsel e-posta gönderimi.
            </li>
          </ul>
          <p>
            Bu aktarımlar KVKK m.9 kapsamında, hizmetin sunulabilmesi için gerekli olduğu ölçüde
            gerçekleştirilir. Verileriniz, bu metinde belirtilen amaçlar dışında üçüncü kişilerle paylaşılmaz;
            reklam/pazarlama amacıyla satılmaz.
          </p>
        </Section>

        <Section title="6. Saklama Süresi">
          <p>
            Kişisel verileriniz, hesabınız aktif olduğu sürece ve ilgili mevzuatta öngörülen zamanaşımı
            süreleri boyunca saklanır. Hesabınızı sildirmeniz hâlinde verileriniz, yasal saklama
            yükümlülükleri saklı kalmak kaydıyla silinir veya anonim hâle getirilir.
          </p>
        </Section>

        <Section title="7. İlgili Kişi Olarak Haklarınız (KVKK m.11)">
          <p>Veri sahibi olarak aşağıdaki haklara sahipsiniz:</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Kişisel verinizin işlenip işlenmediğini öğrenme ve buna ilişkin bilgi talep etme,</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
            <li>Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
            <li>Eksik/yanlış işlenmişse düzeltilmesini isteme,</li>
            <li>Şartları oluştuğunda silinmesini veya yok edilmesini isteme,</li>
            <li>İşlemenin münhasıran otomatik sistemlerle analizi sonucu aleyhinize bir sonuç doğmasına itiraz etme,</li>
            <li>Kanuna aykırı işleme nedeniyle zarara uğramanız hâlinde zararın giderilmesini talep etme.</li>
          </ul>
          <p>
            Bu haklarınızı kullanmak için <strong>[İLETİŞİM E-POSTASI]</strong> adresine başvurabilirsiniz.
            Talebiniz en geç 30 gün içinde sonuçlandırılır.
          </p>
        </Section>

        <Section title="8. Çerezler">
          <p>
            MenuQR yalnızca hizmetin çalışması için <strong>zorunlu (oturum) çerezleri</strong> kullanır;
            bunlar oturumunuzu açık tutmak için gereklidir. Reklam veya üçüncü taraf takip çerezi kullanılmaz.
          </p>
        </Section>

        <Section title="9. Değişiklikler">
          <p>
            Bu metin zaman zaman güncellenebilir. Güncel sürüm her zaman bu sayfada yayımlanır; önemli
            değişikliklerde sizi bilgilendiririz. Yürürlük tarihi yukarıda belirtilmiştir.
          </p>
        </Section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-6 text-sm lg:px-8">
          <span className="flex items-center gap-2">
            <QrCode className="size-4" aria-hidden />
            MenuQR
          </span>
          <Link href="/" className="hover:text-foreground">
            Ana sayfa
          </Link>
        </div>
      </footer>
    </div>
  );
}
