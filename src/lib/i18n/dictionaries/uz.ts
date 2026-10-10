import type { Dictionary } from "./en"

const uz: Dictionary = {
  meta: {
    title: "Istalgan kartani Apple Wallet va Google Wallet’ga qo‘shing — bepul",
    description:
      "Sodiqlik, a’zolik va sovg‘a kartalaridagi shtrix-kodlarni bir necha soniyada Apple Wallet va Google Wallet kartalariga aylantiring. Bepul, ro‘yxatdan o‘tmasdan.",
  },
  hero: {
    tagline:
      "Plastik kartalardagi shtrix-kodlarni Apple Wallet va Google Wallet uchun raqamli kartalarga aylantiruvchi oddiy vosita. Mutlaqo bepul va to‘g‘ridan-to‘g‘ri brauzeringizda ishlaydi.",
    steps: [
      "Sodiqlik yoki a’zolik kartangizning shtrix-kod ma’lumotlarini kiriting.",
      "Karta ko‘rinishi va nomini sozlang.",
      "Apple kartasini yuklab oling yoki Google Wallet havolasini oching.",
    ],
  },
  theme: { toggle: "Mavzuni almashtirish", light: "Yorug‘", dark: "Qorong‘i", system: "Tizim" },
  tabs: { apple: "Apple Wallet", google: "Google Wallet" },
  code: {
    heading: "Kodni skanerlang yoki yuklang",
    processedLocally: "Qurilmada qayta ishlanadi",
    scan: "Kamera bilan skanerlash",
    upload: "Rasm yuklash",
    orManual: "yoki qo‘lda kiriting",
    dataLabel: "Shtrix-kod ma’lumoti",
    dataPlaceholder: "123456789",
    formatLabel: "Kod formati",
    formatHint: "Bilmaysizmi? Kvadrat kodlar uchun QR, oddiy shtrix-kodlar uchun Code 128 ni tanlang.",
    detected: "{format} aniqlandi",
    notFound: "Rasmda shtrix-kod topilmadi. Aniqroq rasm yuklang yoki kodni qo‘lda kiriting.",
    cameraTitle: "Shtrix-kodni skanerlash",
    cameraHint: "Kamerani shtrix-kodga qarating va telefonni qimirlatmang.",
    cameraError: "Kameraga ruxsat yo‘q. Ruxsat bering yoki rasm yuklang.",
    cancel: "Bekor qilish",
    ean13Apple:
      "iOS 27 va undan yangi iPhone’larda EAN-13 o‘zicha ko‘rsatiladi; eskiroq iPhone’larda xuddi shu raqam Code 128 formatida bo‘ladi.",
  },
  design: {
    titleLabel: "Karta nomi",
    titlePlaceholder: "masalan, Korzinka",
    logoLabel: "Logotip",
    optional: "(ixtiyoriy)",
    uploadLogo: "Logotip yuklash",
    removeLogo: "O‘chirish",
    logoHint: "PNG formatiga o‘tkaziladi va kartaga joylanadi.",
    labelLabel: "Yorliq",
    labelPlaceholder: "Karta raqami",
    valueLabel: "Qiymat",
    valuePlaceholder: "12345",
    colorLabel: "Rang",
    customColor: "Boshqa rang",
  },
  preview: { heading: "Ko‘rinishi" },
  actions: {
    addApple: "Apple Wallet’ga qo‘shish",
    addGoogle: "Google Wallet’ga qo‘shish",
    working: "Karta yaratilmoqda…",
  },
  errors: {
    empty: "Shtrix-kod ma’lumotini kiriting.",
    tooLong: "Bu kod tanlangan format uchun juda uzun.",
    digitsOnly: "Bu formatda faqat raqamlar bo‘lishi mumkin.",
    length: "Bu format uchun raqamlar soni noto‘g‘ri.",
    checksum: "Oxirgi (nazorat) raqami mos kelmadi. Raqamni tekshiring.",
    charset: "Bu format ba’zi belgilarni qo‘llab-quvvatlamaydi. QR kodni sinab ko‘ring.",
    titleRequired: "Karta nomini kiriting.",
    logoInvalid: "Rasmni o‘qib bo‘lmadi. PNG yoki JPG faylni sinab ko‘ring.",
    apple_not_configured: "Apple Wallet kartalari hozircha mavjud emas. Keyinroq urinib ko‘ring.",
    google_not_configured: "Google Wallet kartalari hozircha mavjud emas. Keyinroq urinib ko‘ring.",
    apple_failed: "Apple kartasini yaratib bo‘lmadi. Qaytadan urinib ko‘ring.",
    google_failed: "Google kartasini yaratib bo‘lmadi. Qaytadan urinib ko‘ring.",
    invalid_input: "Ba’zi maydonlar noto‘g‘ri to‘ldirilgan. Formani tekshiring.",
    network: "Tarmoq xatosi. Internet aloqasini tekshirib, qaytadan urinib ko‘ring.",
  },
  inApp: {
    body: "Kartani Apple Wallet’ga qo‘shish uchun bu sahifani Safari’da oching.",
    copy: "Havolani nusxalash",
    copied: "Havola nusxalandi",
  },
  privacy:
    "Biz karta ma’lumotlaringizni saqlamaymiz. Kod qurilmangizda o‘qiladi; karta serverimizda imzolanadi va darhol o‘chiriladi.",
  footer: "Apple, Google yoki kartasini qo‘shayotgan do‘konlaringiz bilan aloqador emasmiz.",
}

export default uz
