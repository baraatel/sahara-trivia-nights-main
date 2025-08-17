# Arabic-Only Questions Migration

## نظرة عامة
هذا التحديث يزيل جميع الحقول الإنجليزية من جدول الأسئلة ويحول النظام إلى اللغة العربية فقط.

## الملفات المطلوبة
1. `20250816010000_remove_english_fields.sql` - إزالة الحقول الإنجليزية
2. `20250816010001_update_related_tables.sql` - تحديث الجداول والوظائف المرتبطة

## كيفية التطبيق

### الطريقة الأولى: عبر Supabase CLI
```bash
# تأكد من أنك في مجلد المشروع
cd your-project-directory

# تطبيق التحديثات
supabase db push

# أو تطبيق migration محدد
supabase migration up
```

### الطريقة الثانية: عبر Supabase Dashboard
1. اذهب إلى Supabase Dashboard
2. اختر مشروعك
3. اذهب إلى SQL Editor
4. انسخ محتوى الملف الأول `20250816010000_remove_english_fields.sql`
5. اضغط Run
6. كرر نفس العملية للملف الثاني `20250816010001_update_related_tables.sql`

## التغييرات المطبقة

### إزالة الحقول الإنجليزية:
- ❌ `question_en`
- ❌ `option_a_en`
- ❌ `option_b_en`
- ❌ `option_c_en`
- ❌ `option_d_en`
- ❌ `explanation_en`

### الحقول المتبقية (العربية فقط):
- ✅ `question_ar` - السؤال
- ✅ `option_a_ar` - الخيار أ
- ✅ `option_b_ar` - الخيار ب
- ✅ `option_c_ar` - الخيار ج
- ✅ `option_d_ar` - الخيار د
- ✅ `explanation_ar` - شرح الإجابة (اختياري)
- ✅ `correct_answer` - الإجابة الصحيحة
- ✅ `difficulty_level` - مستوى الصعوبة

## الوظائف الجديدة المضافة

### 1. `get_random_questions_arabic(category_id, count)`
```sql
-- الحصول على أسئلة عشوائية لفئة معينة
SELECT * FROM get_random_questions_arabic('category-uuid', 10);
```

### 2. `search_questions_arabic(search_term)`
```sql
-- البحث في الأسئلة باللغة العربية
SELECT * FROM search_questions_arabic('كلمة البحث');
```

### 3. `get_questions_by_difficulty_arabic(level, category_id)`
```sql
-- الحصول على أسئلة بمستوى صعوبة معين
SELECT * FROM get_questions_by_difficulty_arabic(3, 'category-uuid');
```

### 4. `get_question_stats_arabic()`
```sql
-- إحصائيات الأسئلة
SELECT * FROM get_question_stats_arabic();
```

## التحقق من التطبيق

### 1. التحقق من هيكل الجدول:
```sql
-- التحقق من أن الحقول الإنجليزية تم حذفها
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'questions' 
ORDER BY ordinal_position;
```

### 2. التحقق من الوظائف الجديدة:
```sql
-- التحقق من وجود الوظائف الجديدة
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name LIKE '%arabic%';
```

### 3. اختبار إضافة سؤال جديد:
```sql
-- اختبار إضافة سؤال باللغة العربية فقط
INSERT INTO questions (
  category_id, 
  question_ar, 
  option_a_ar, 
  option_b_ar, 
  option_c_ar, 
  option_d_ar, 
  correct_answer, 
  difficulty_level
) VALUES (
  'category-uuid',
  'ما هي عاصمة مصر؟',
  'القاهرة',
  'الإسكندرية',
  'الأقصر',
  'أسوان',
  'A',
  1
);
```

## ملاحظات مهمة

### ⚠️ تحذيرات:
1. **النسخ الاحتياطي**: تأكد من عمل نسخة احتياطية من قاعدة البيانات قبل التطبيق
2. **البيانات الموجودة**: إذا كان لديك بيانات إنجليزية مهمة، احفظها قبل التطبيق
3. **التطبيق**: تأكد من تطبيق الملفين بالترتيب الصحيح

### ✅ فوائد التحديث:
1. **أداء محسن**: تقليل حجم البيانات المحملة
2. **صيانة أسهل**: تقليل التعقيد في الكود
3. **واجهة أبسط**: تركيز على المحتوى العربي فقط
4. **تحسين البحث**: فهرسة محسنة للنص العربي

### 🔧 في حالة حدوث مشاكل:
1. تحقق من سجلات الأخطاء في Supabase
2. تأكد من تطبيق الملفات بالترتيب الصحيح
3. تحقق من صلاحيات المستخدمين
4. إذا لزم الأمر، يمكن التراجع عن التحديث

## الدعم
إذا واجهت أي مشاكل، راجع:
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- سجلات الأخطاء في Supabase Dashboard
