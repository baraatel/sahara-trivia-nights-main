# إعداد ملف البيئة - Supabase Cloud

## 📝 إنشاء ملف .env.local

أنشئ ملف `.env.local` في مجلد المشروع الرئيسي وأضف المحتوى التالي:

```env
# Supabase Cloud Configuration
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# معلومات إضافية
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_DB_PASSWORD=your-database-password
```

## 🔑 كيفية الحصول على القيم

### 1. Project URL
- اذهب إلى Settings > API في Supabase Dashboard
- انسخ **Project URL**

### 2. Anon Key
- في نفس الصفحة، انسخ **anon public key**

### 3. Service Role Key
- في نفس الصفحة، انسخ **service_role key**

### 4. Project Ref
- من Project URL، استخرج الجزء قبل `.supabase.co`
- مثال: من `https://abc123.supabase.co` يكون `abc123`

### 5. Database Password
- كلمة المرور التي أدخلتها عند إنشاء المشروع

## ⚠️ ملاحظات مهمة

- **لا تشارك** هذه المفاتيح مع أي شخص
- **لا ترفع** ملف `.env.local` إلى Git
- **تأكد** من أن الملف في `.gitignore`

## ✅ مثال على الملف النهائي

```env
VITE_SUPABASE_URL=https://xzmqbzbrkknemklswemh.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_REF=xzmqbzbrkknemklswemh
SUPABASE_DB_PASSWORD=your-secure-password
```
