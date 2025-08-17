import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QuestionActions from "./QuestionActions";
import QuestionForm from "./QuestionForm";
import QuestionList from "./QuestionList";

const QuestionManager = () => {
  const [questions, setQuestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    category_id: '',
    question_ar: '',
    option_a_ar: '',
    option_b_ar: '',
    option_c_ar: '',
    option_d_ar: '',
    correct_answer: 'A',
    difficulty_level: 1,
    explanation_ar: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchQuestions();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log("Fetching categories...");
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name_ar');

      if (error) {
        console.error("Categories fetch error:", error);
        throw error;
      }
      
      console.log("Categories fetched:", data);
      setCategories(data || []);
    } catch (error) {
      console.error("Categories fetch failed:", error);
              toast({
          title: "خطأ",
          description: "فشل في تحميل الفئات",
          variant: "destructive",
        });
    }
  };

  const fetchQuestions = async () => {
    try {
      console.log("Fetching questions...");
      setLoading(true);
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          categories (name_ar)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Questions fetch error:", error);
        throw error;
      }
      
      console.log("Questions fetched:", data);
      setQuestions(data || []);
    } catch (error) {
      console.error("Questions fetch failed:", error);
              toast({
          title: "خطأ",
          description: "فشل في تحميل الأسئلة",
          variant: "destructive",
        });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        const { error } = await supabase
          .from('questions')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
        
        toast({
          title: "نجح",
          description: "تم تحديث السؤال بنجاح",
        });
      } else {
        const { error } = await supabase
          .from('questions')
          .insert([formData]);

        if (error) throw error;
        
        toast({
          title: "نجح",
          description: "تم إنشاء السؤال بنجاح",
        });
      }

      resetForm();
      fetchQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (question) => {
    setFormData(question);
    setEditingId(question.id);
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
              toast({
          title: "نجح",
          description: "تم حذف السؤال بنجاح",
        });
      
      fetchQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      category_id: '',
      question_ar: '',
      option_a_ar: '',
      option_b_ar: '',
      option_c_ar: '',
      option_d_ar: '',
      correct_answer: 'A',
      difficulty_level: 1,
      explanation_ar: ''
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleCSVImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const text = await file.text();
    const lines = text.split('\n');
    
            const questions = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            if (values.length >= 8) {
              questions.push({
                category_id: values[0],
                question_ar: values[1],
                option_a_ar: values[2],
                option_b_ar: values[3],
                option_c_ar: values[4],
                option_d_ar: values[5],
                correct_answer: values[6],
                difficulty_level: parseInt(values[7]) || 1,
                explanation_ar: values[8] || ''
              });
            }
          }
        }

    try {
      const { error } = await supabase
        .from('questions')
        .insert(questions);

      if (error) throw error;
      
              toast({
          title: "نجح",
          description: `تم استيراد ${questions.length} سؤال بنجاح`,
        });
      
      fetchQuestions();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const downloadTemplate = () => {
    const headers = [
      'category_id',
      'question_ar',
      'option_a_ar',
      'option_b_ar',
      'option_c_ar',
      'option_d_ar',
      'correct_answer',
      'difficulty_level',
      'explanation_ar'
    ];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'questions_template_arabic.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredQuestions = selectedCategory 
    ? questions.filter(q => q.category_id === selectedCategory)
    : questions;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">جاري تحميل الأسئلة...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <QuestionActions
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onAddQuestion={() => setShowAddForm(true)}
        handleCSVImport={handleCSVImport}
        downloadTemplate={downloadTemplate}
      />

      {showAddForm && (
        <QuestionForm
          categories={categories}
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleSubmit}
          onCancel={resetForm}
          isEditing={!!editingId}
        />
      )}

      <QuestionList
        questions={filteredQuestions}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default QuestionManager;
