
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, X, Image, Video, Music, Upload } from "lucide-react";

interface QuestionFormProps {
  categories: any[];
  formData: any;
  setFormData: (data: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

const QuestionForm = ({ 
  categories, 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isEditing 
}: QuestionFormProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'تعديل السؤال' : 'إضافة سؤال جديد'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category_id">الفئة</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({...formData, category_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name_ar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty_level">مستوى الصعوبة</Label>
              <Select 
                value={formData.difficulty_level.toString()} 
                onValueChange={(value) => setFormData({...formData, difficulty_level: parseInt(value)})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      المستوى {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="question_ar">السؤال</Label>
            <Textarea
              id="question_ar"
              value={formData.question_ar}
              onChange={(e) => setFormData({...formData, question_ar: e.target.value})}
              required
              className="text-right"
              dir="rtl"
              placeholder="اكتب السؤال هنا..."
            />
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">خيارات الإجابة</h4>
            {['a', 'b', 'c', 'd'].map((option) => (
              <div key={option}>
                <Label>{`الخيار ${option.toUpperCase()}`}</Label>
                <Input
                  value={formData[`option_${option}_ar`]}
                  onChange={(e) => setFormData({...formData, [`option_${option}_ar`]: e.target.value})}
                  required
                  className="text-right"
                  dir="rtl"
                  placeholder={`اكتب الخيار ${option.toUpperCase()} هنا...`}
                />
              </div>
            ))}
          </div>

          <div>
            <Label>الإجابة الصحيحة</Label>
            <RadioGroup 
              value={formData.correct_answer} 
              onValueChange={(value) => setFormData({...formData, correct_answer: value})}
              className="flex gap-4 mt-2"
            >
              {['A', 'B', 'C', 'D'].map((option) => (
                <div key={option} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={option} />
                  <Label htmlFor={option}>الخيار {option}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="explanation_ar">شرح الإجابة (اختياري)</Label>
            <Textarea
              id="explanation_ar"
              value={formData.explanation_ar}
              onChange={(e) => setFormData({...formData, explanation_ar: e.target.value})}
              className="text-right"
              dir="rtl"
              placeholder="اكتب شرح الإجابة هنا..."
            />
          </div>

          {/* Media Attachments Section */}
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4" />
              المرفقات (اختياري)
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Image URL */}
              <div>
                <Label htmlFor="image_url" className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-blue-500" />
                  رابط الصورة
                </Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                  placeholder="https://example.com/image.jpg"
                  className="text-right"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1">
                  يدعم: JPG, PNG, GIF, WebP
                </p>
              </div>

              {/* Video URL */}
              <div>
                <Label htmlFor="video_url" className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-green-500" />
                  رابط الفيديو
                </Label>
                <Input
                  id="video_url"
                  type="url"
                  value={formData.video_url || ''}
                  onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                  placeholder="https://example.com/video.mp4"
                  className="text-right"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1">
                  يدعم: MP4, AVI, MOV, WebM
                </p>
              </div>

              {/* Audio URL */}
              <div>
                <Label htmlFor="audio_url" className="flex items-center gap-2">
                  <Music className="h-4 w-4 text-purple-500" />
                  رابط الصوت
                </Label>
                <Input
                  id="audio_url"
                  type="url"
                  value={formData.audio_url || ''}
                  onChange={(e) => setFormData({...formData, audio_url: e.target.value})}
                  placeholder="https://example.com/audio.mp3"
                  className="text-right"
                  dir="rtl"
                />
                <p className="text-xs text-gray-500 mt-1">
                  يدعم: MP3, WAV, OGG, M4A
                </p>
              </div>
            </div>

            {/* Media Preview */}
            {(formData.image_url || formData.video_url || formData.audio_url) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h5 className="font-medium mb-2">معاينة المرفقات:</h5>
                <div className="space-y-2">
                  {formData.image_url && (
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">صورة: {formData.image_url}</span>
                    </div>
                  )}
                  {formData.video_url && (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-green-500" />
                      <span className="text-sm">فيديو: {formData.video_url}</span>
                    </div>
                  )}
                  {formData.audio_url && (
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-purple-500" />
                      <span className="text-sm">صوت: {formData.audio_url}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="submit" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isEditing ? 'تحديث' : 'إنشاء'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              إلغاء
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuestionForm;
