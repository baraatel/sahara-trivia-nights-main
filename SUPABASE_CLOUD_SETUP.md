# إعداد Supabase Cloud - بديل Docker

## 🚀 إعداد سريع بدون Docker

### 1. إنشاء مشروع Supabase Cloud

1. اذهب إلى https://supabase.com
2. سجل الدخول أو أنشئ حساب جديد
3. انقر على "New Project"
4. اختر اسم المشروع: `sahara-trivia-nights`
5. اختر كلمة مرور لقاعدة البيانات
6. اختر المنطقة الأقرب لك
7. انقر على "Create new project"

### 2. الحصول على بيانات الاتصال

1. في لوحة التحكم، اذهب إلى Settings > API
2. انسخ:
   - **Project URL**
   - **anon public key**
   - **service_role key**

### 3. تحديث ملف البيئة

أنشئ ملف `.env.local` في مجلد المشروع:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 4. تطبيق الهجرات

```bash
# تعيين متغيرات البيئة
set SUPABASE_ACCESS_TOKEN=your_access_token_here
set SUPABASE_DB_PASSWORD=your_db_password_here

# تطبيق الهجرات
npx supabase db push --project-ref your_project_ref
```

### 5. تشغيل التطبيق

```bash
npm run dev
```

## 🔑 الحصول على Access Token

1. اذهب إلى https://supabase.com/dashboard/account/tokens
2. انقر على "Generate new token"
3. اختر "service_role"
4. انسخ الـ token

## 📊 الوصول للوحة التحكم

- **Supabase Dashboard**: https://supabase.com/dashboard
- **Table Editor**: https://supabase.com/dashboard/project/[project-id]/editor
- **SQL Editor**: https://supabase.com/dashboard/project/[project-id]/sql

## ✅ المزايا

- ✅ لا حاجة لـ Docker
- ✅ قاعدة بيانات في السحابة
- ✅ نسخ احتياطية تلقائية
- ✅ أداء أفضل
- ✅ سهولة الوصول من أي مكان

## ⚠️ ملاحظات

- تأكد من عدم مشاركة مفاتيح API
- استخدم متغيرات البيئة لحماية البيانات
- راجع إعدادات الأمان في Supabase Dashboard

---

**هذا الحل بديل ممتاز إذا واجهت مشاكل مع Docker! 🎉**
