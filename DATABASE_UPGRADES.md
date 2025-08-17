# تحديثات قاعدة البيانات المطلوبة

## ملخص التحديثات

تم إنشاء 3 ملفات هجرة جديدة لإضافة الميزات المطلوبة:

### 1. إضافة أعمدة الوسائط إلى جدول الأسئلة
**الملف:** `supabase/migrations/20250817000000_add_media_fields_to_questions.sql`

**التحديثات:**
- إضافة عمود `image_url` (رابط الصورة)
- إضافة عمود `video_url` (رابط الفيديو)
- إضافة عمود `audio_url` (رابط الصوت)
- إنشاء فهارس لتحسين الأداء

### 2. إضافة عمود team_assignment إلى جدول game_purchase_categories
**الملف:** `supabase/migrations/20250817000001_add_team_assignment_to_game_purchase_categories.sql`

**التحديثات:**
- إضافة عمود `team_assignment` (team1, team2, أو NULL)
- إنشاء دالة للتحقق من صحة التخصيص (حد أقصى 3 فئات لكل فريق)
- إنشاء trigger للتحقق التلقائي

### 3. إنشاء جداول games و team_games الحقيقية
**الملف:** `supabase/migrations/20250817000002_create_real_games_and_team_games.sql`

**التحديثات:**
- إنشاء جدول `games` للألعاب الفردية والجماعية
- إنشاء جدول `team_games` لألعاب الفرق
- إنشاء دوال مساعدة:
  - `create_game_from_purchase()` - إنشاء لعبة من شراء
  - `start_game()` - بدء لعبة
  - `finish_game()` - إنهاء لعبة

## كيفية التطبيق

### 1. تطبيق الهجرات
```bash
# في مجلد المشروع
supabase db push
```

### 2. تحديث أنواع TypeScript
بعد تطبيق الهجرات، قم بتحديث ملف `src/integrations/supabase/types.ts`:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

### 3. تفعيل الميزات في الكود

#### تفعيل MediaPlayer
في ملف `src/components/QuizGame.tsx`، قم بإزالة التعليق من MediaPlayer:

```typescript
{/* Media Player */}
<MediaPlayer
  imageUrl={currentQuestion.image_url}
  videoUrl={currentQuestion.video_url}
  audioUrl={currentQuestion.audio_url}
  language={language}
/>
```

#### تفعيل حفظ الإجابات
في ملف `src/components/QuizGame.tsx`، استبدل الكود المؤقت بـ:

```typescript
// Save answer to database if we have a real game ID
if (game.id && game.id !== 'single-player' && !game.id.startsWith('game_')) {
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    try {
      if (isTeamGame) {
        // Save to team game answers
        await supabase.from('team_game_answers').insert({
          team_game_id: game.id,
          user_id: user.id,
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_taken: 30 - timeLeft,
          points_earned: isCorrect ? questionPoints : 0,
          team: currentTurn
        });
      } else {
        // Save to regular game answers
        await supabase.from('game_answers').insert({
          game_id: game.id,
          user_id: user.id,
          question_id: currentQuestion.id,
          selected_answer: selectedAnswer,
          is_correct: isCorrect,
          time_taken: 30 - timeLeft,
          points_earned: isCorrect ? questionPoints : 0
        });
      }
    } catch (error) {
      console.log('Error saving answer to database:', error);
    }
  }
}
```

#### تفعيل دعم team_assignment
في ملف `src/components/QuizGame.tsx`، استبدل استعلام الفئات بـ:

```typescript
const { data: purchaseCategories, error: catError } = await supabase
  .from('game_purchase_categories')
  .select('category_id, team_assignment')
  .eq('game_purchase_id', game.game_purchase_id);

if (catError) throw catError;

if (isTeamGame) {
  // For team games, use team_assignment if available, otherwise split evenly
  const team1Categories = purchaseCategories
    .filter(cat => cat.team_assignment === 'team1')
    .map(cat => cat.category_id);
  const team2Categories = purchaseCategories
    .filter(cat => cat.team_assignment === 'team2')
    .map(cat => cat.category_id);
  
  // If no team_assignment, split evenly
  if (team1Categories.length === 0 && team2Categories.length === 0) {
    const categoryIds = purchaseCategories.map(cat => cat.category_id);
    const half = Math.ceil(categoryIds.length / 2);
    team1Categories.push(...categoryIds.slice(0, half));
    team2Categories.push(...categoryIds.slice(half));
  }
}
```

## الميزات الجديدة

### 1. دعم الوسائط
- يمكن إضافة صور وفيديوهات وأصوات للأسئلة
- MediaPlayer سيعرض الوسائط تلقائياً

### 2. تخصيص الفرق
- يمكن تخصيص فئات محددة لكل فريق
- نظام تحقق يضمن عدم تجاوز 3 فئات لكل فريق

### 3. ألعاب حقيقية
- إنشاء سجلات حقيقية في قاعدة البيانات
- تتبع حالة اللعبة (waiting, active, finished, cancelled)
- دعم الألعاب متعددة اللاعبين

### 4. حفظ الإجابات
- حفظ جميع الإجابات في قاعدة البيانات
- تتبع النقاط والوقت المستغرق
- دعم ألعاب الفرق والألعاب الفردية

## ملاحظات مهمة

1. **النسخ الاحتياطي:** تأكد من عمل نسخة احتياطية من قاعدة البيانات قبل التطبيق
2. **الاختبار:** اختبر التحديثات في بيئة التطوير أولاً
3. **التوافق:** تأكد من أن جميع التطبيقات متوافقة مع التحديثات الجديدة
4. **الأداء:** الفهارس الجديدة ستحسن أداء الاستعلامات

## استكشاف الأخطاء

### مشكلة: "column 'team_assignment' does not exist"
**الحل:** تأكد من تطبيق ملف الهجرة `20250817000001_add_team_assignment_to_game_purchase_categories.sql`

### مشكلة: "table 'team_game_answers' does not exist"
**الحل:** تأكد من تطبيق ملف الهجرة `20250816030000_team_game_answers.sql`

### مشكلة: TypeScript errors
**الحل:** قم بتحديث أنواع TypeScript بعد تطبيق الهجرات
