# حل مشاكل Docker - دليل شامل

## 🚨 المشكلة الحالية
```
failed to inspect service: error during connect: in the default daemon configuration on Windows, the docker client must be run with elevated privileges to connect
```

## 🔧 الحلول بالترتيب

### الحل 1: تشغيل Docker Desktop

1. **ابحث عن Docker Desktop** في قائمة Start
2. **انقر عليه** لتشغيله
3. **انتظر** حتى يظهر "Docker Desktop is running" في شريط المهام
4. **أعد تشغيل** PowerShell

### الحل 2: تشغيل PowerShell كمدير

1. **انقر بزر الماوس الأيمن** على PowerShell
2. **اختر** "Run as administrator"
3. **انتقل** إلى مجلد المشروع:
   ```bash
   cd "D:\projects cursor\sahara-trivia-nights-main"
   ```
4. **جرب تشغيل Supabase**:
   ```bash
   npx supabase start
   ```

### الحل 3: إعادة تشغيل Docker Desktop

1. **أغلق** Docker Desktop تماماً
2. **انتظر** 30 ثانية
3. **أعد تشغيل** Docker Desktop
4. **انتظر** حتى يبدأ بالكامل
5. **جرب مرة أخرى**:
   ```bash
   npx supabase start
   ```

### الحل 4: إعادة تعيين Docker

1. **افتح** Docker Desktop
2. **اذهب إلى** Settings > Troubleshoot
3. **انقر على** "Reset to factory defaults"
4. **أعد تشغيل** Docker Desktop

### الحل 5: تثبيت Docker Desktop

إذا لم يكن مثبت:

1. **اذهب إلى**: https://www.docker.com/products/docker-desktop/
2. **حمل** Docker Desktop for Windows
3. **ثبت** البرنامج
4. **أعد تشغيل** الكمبيوتر
5. **شغل** Docker Desktop

## ✅ التحقق من الحل

```bash
# تحقق من تشغيل Docker
docker --version

# تحقق من حالة Docker
docker info

# تحقق من الحاويات النشطة
docker ps
```

## 🚀 تشغيل Supabase بعد حل المشكلة

```bash
# إيقاف Supabase إذا كان يعمل
npx supabase stop

# تشغيل Supabase
npx supabase start

# تطبيق الهجرات
npx supabase db push

# تشغيل التطبيق
npm run dev
```

## 🔄 بديل سريع - Supabase Cloud

إذا استمرت المشكلة، استخدم Supabase Cloud:

1. **راجع ملف**: `SUPABASE_CLOUD_SETUP.md`
2. **اتبع الخطوات** لإعداد مشروع في السحابة
3. **لا تحتاج Docker** نهائياً

## 📞 الدعم الإضافي

### مشاكل شائعة أخرى:

1. **WSL2 غير مثبت**:
   ```bash
   wsl --install
   ```

2. **Hyper-V غير مفعل**:
   - افتح "Turn Windows features on or off"
   - فعّل Hyper-V

3. **مشاكل في المنافذ**:
   ```bash
   # تحقق من المنافذ المستخدمة
   netstat -ano | findstr :5432
   ```

## 🎯 النتيجة المتوقعة

بعد حل المشكلة:
- ✅ Docker Desktop يعمل
- ✅ Supabase يبدأ بنجاح
- ✅ قاعدة البيانات متاحة
- ✅ التطبيق يعمل على http://localhost:8092

---

**إذا استمرت المشكلة، استخدم Supabase Cloud كبديل! 🚀**
