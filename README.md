# Artful Guesser 🎨

Artful Guesser, yapay zeka destekli çizim ve tahmin oyunu uygulamasıdır. Kullanıcılar hem yapay zekaya karşı hem de diğer oyuncularla çok oyunculu modda oynayabilirler.

## 🌟 Özellikler

### 🤖 Yapay Zeka Modları
- **AI Tahmin Modu**: Yapay zeka bir açıklama verir, siz ne olduğunu tahmin edersiniz
- **Sen Çiz, AI Tahmin Etsin**: Bir şeyler çizin, yapay zeka ne çizdiğinizi tahmin etsin

### 👥 Çok Oyunculu Mod
- Gerçek zamanlı çok oyunculu oyun deneyimi
- Sırayla çizim ve tahmin sistemi
- Puan tablosu ve rekabet
- Lobiler ve oyun odaları

### 🎯 Oyun Özellikleri
- İnteraktif çizim canvas'ı
- Gerçek zamanlı puan takibi
- Geri alma özelliği ile çizim
- Responsive tasarım (mobil uyumlu)
- Türkçe dil desteği

## 🛠️ Teknoloji Stack'i

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Firebase Firestore
- **AI**: Google Genkit with Gemini 2.0 Flash
- **Real-time**: Firebase Real-time listeners
- **Deployment**: Firebase App Hosting

## 📦 Kurulum

### Gereksinimler
- Node.js 20+
- Firebase projesi
- Google AI (Gemini) API anahtarı

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd artful-guesser
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Ortam Değişkenlerini Ayarlayın
`.env.local` dosyası oluşturun:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google AI (Gemini) API Key
GEMINI_API_KEY=your_gemini_api_key
```

### 4. Firebase Kurulumu
1. [Firebase Console](https://console.firebase.google.com/)'da yeni proje oluşturun
2. Firestore Database'i etkinleştirin
3. Web uygulaması yapılandırmasını alın ve `.env.local`'e ekleyin

### 5. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

Uygulama [http://localhost:9002](http://localhost:9002) adresinde çalışacaktır.

## 🎮 Kullanım

### Ana Sayfa
- Üç farklı oyun modundan birini seçin
- Her mod için açıklamalar ve başlangıç butonları mevcuttur

### AI Tahmin Modu (`/ai-game`)
1. Zorluk seviyesi seçin (Kolay/Orta/Zor)
2. AI'nin verdiği açıklamayı okuyun
3. Ne olduğunu tahmin edin
4. Puanınızı görün ve sonraki tura geçin

### Sen Çiz, AI Tahmin Etsin (`/user-draws-game`)
1. Çizim alanında bir şeyler çizin
2. "Tahmin Et!" butonuna tıklayın
3. AI'nin tahminini ve güven skorunu görün
4. Alternatif tahminleri inceleyin

### Çok Oyunculu Mod (`/multiplayer-game`)
1. Görünen adınızı girin
2. Yeni oyun oluşturun veya mevcut oyuna katılın
3. Oyun ID'sini arkadaşlarınızla paylaşın
4. Sırayla çizin ve tahmin edin

## 🏗️ Proje Yapısı

```
src/
├── ai/                     # AI flows ve Genkit yapılandırması
│   ├── flows/             # AI işlem akışları
│   └── genkit.ts          # Genkit yapılandırması
├── app/                   # Next.js app router sayfaları
│   ├── ai-game/          # AI tahmin modu
│   ├── user-draws-game/  # Çizim modu
│   ├── multiplayer-game/ # Çok oyunculu mod
│   └── layout.tsx        # Ana layout
├── components/            # React bileşenleri
│   ├── game/             # Oyun bileşenleri
│   ├── layout/           # Layout bileşenleri
│   └── ui/               # shadcn/ui bileşenleri
├── hooks/                # React hooks
├── lib/                  # Utility fonksiyonları
├── services/             # Firebase servisleri
└── types/                # TypeScript tip tanımları
```

## 🔧 Geliştirme

### AI Geliştirme
```bash
# Genkit geliştirme modunu başlat
npm run genkit:dev

# Genkit watch modu
npm run genkit:watch
```

### Build ve Deploy
```bash
# Production build
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
```

## 📱 Responsive Tasarım

Uygulama tüm cihaz boyutlarında çalışacak şekilde tasarlanmıştır:
- Mobil telefonlar (768px altı)
- Tabletler (768px - 1024px)
- Masaüstü (1024px üzeri)

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary**: Vibrant Blue (#4285F4)
- **Background**: Light Blue (#E3F2FD)
- **Accent**: Yellow-Orange (#FFCA28)
- **Font**: Inter (Grotesque sans-serif)

### UI Bileşenleri
- shadcn/ui tabanlı modern bileşen sistemi
- Tutarlı spacing ve typography
- Accessible tasarım prensipleri

## 🔐 Güvenlik

- Firebase Security Rules ile veri koruması
- Client-side form validasyonu
- Sanitized user inputs
- Environment variables ile API anahtarları koruması

## 🚀 Deployment

### Firebase App Hosting
1. Firebase CLI'yi yükleyin
2. Proje klasöründe `firebase init hosting` çalıştırın
3. Build alın: `npm run build`
4. Deploy edin: `firebase deploy`

### Diğer Platformlar
- Vercel
- Netlify
- Heroku

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/AmazingFeature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add some AmazingFeature'`)
4. Branch'inizi push edin (`git push origin feature/AmazingFeature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🐛 Bilinen Sorunlar

- Çok oyunculu modda bazen bağlantı kesilme sorunları yaşanabilir
- Mobil cihazlarda çizim hassasiyeti düşük olabilir
- AI tahminleri bazen yavaş olabilir

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. GitHub Issues'dan issue açın
2. Detaylı açıklama ve reproduktif adımlar ekleyin
3. Console loglarını paylaşın

## 🔮 Gelecek Özellikler

- [ ] Ses efektleri
- [ ] Animasyonlar
- [ ] Daha fazla AI modeli desteği
- [ ] Tema değiştirme
- [ ] Profil sistemi
- [ ] Başarı rozetleri
- [ ] Replay sistemi

---

**Artful Guesser** ile yaratıcılığınızı keşfedin ve eğlenceli tahmin oyunlarının tadını çıkarın! 🎨✨
