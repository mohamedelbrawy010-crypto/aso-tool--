# 📱 ASO Pro Tool — دليل التشغيل الكامل

أداة احترافية لتحليل وتحسين ترتيب تطبيقات Android في Google Play.
**البيانات حقيقية 100%** مباشرة من Google Play.

---

## ✨ المميزات

| الميزة | الوصف |
|--------|-------|
| 🔍 تحليل ASO | نتيجة من 100 مع توصيات حقيقية |
| 🔎 بحث بكلمة | أي تطبيقات تتصدر نتائج البحث |
| 📈 ترتيبي | ترتيب تطبيقك في أي كلمة مفتاحية |
| 💬 المراجعات | آخر 20 مراجعة من المستخدمين |
| ⚔️ المنافسون | تطبيقات مشابهة لتطبيقك |

---

## 🚀 التشغيل المحلي (على جهازك)

### المتطلبات
- Node.js 18+ (حمّله من nodejs.org)

### الخطوات
```bash
# 1. فك الضغط وادخل المجلد
cd aso-tool

# 2. تثبيت المكتبات
npm install

# 3. تشغيل السيرفر
npm start

# 4. افتح المتصفح على
http://localhost:3000
```

---

## ☁️ النشر على Railway (مجاناً)

### الخطوة 1: إنشاء حساب
- اذهب إلى https://railway.app
- سجّل بحساب GitHub

### الخطوة 2: رفع الكود
```bash
# تأكد أن git مثبت
git init
git add .
git commit -m "first commit"

# ارفع على GitHub أولاً
# ثم اربط الـ repo بـ Railway
```

### الخطوة 3: النشر على Railway
1. في Railway اضغط **New Project**
2. اختر **Deploy from GitHub repo**
3. اختر الـ repo
4. Railway سيكتشف الإعدادات تلقائياً ويشغّله
5. اضغط **Generate Domain** للحصول على رابط

### الخطوة 4: إعداد المتغيرات (اختياري)
في Railway → Variables:
```
PORT = 3000
```

---

## 🌐 النشر على Render (مجاناً)

1. اذهب إلى https://render.com
2. **New → Web Service**
3. اربط GitHub repo
4. اضبط:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
5. اضغط **Deploy**

---

## 📡 API Endpoints

بعد التشغيل يمكنك استخدام هذه الـ endpoints مباشرة:

```
GET /api/app/{appId}           ← معلومات تطبيق
GET /api/analyze/{appId}       ← تحليل ASO كامل
GET /api/search?q={keyword}    ← بحث بكلمة مفتاحية
GET /api/rank?appId=X&keyword=Y ← ترتيب في كلمة
GET /api/reviews/{appId}       ← المراجعات
GET /api/similar/{appId}       ← التطبيقات المشابهة
```

---

## 💰 التكلفة

| الخدمة | التكلفة |
|--------|---------|
| google-play-scraper | مجاني تماماً |
| Railway / Render | مجاني حتى حد معقول |
| **الإجمالي** | **$0/شهر** |

---

## ⚠️ ملاحظة مهمة

هذه الأداة تعتمد على `google-play-scraper` وهي مكتبة مفتوحة المصدر تقرأ بيانات Google Play العامة. البيانات المُعادة هي نفس البيانات الظاهرة للمستخدم على المتجر. لا تستخدم API رسمية من Google.

---

## 🛠️ هيكل المشروع

```
aso-tool/
├── server.js        ← Backend (Node.js + Express)
├── public/
│   └── index.html   ← Frontend (HTML + CSS + JS)
├── package.json
├── railway.toml     ← إعدادات Railway
└── README.md
```
