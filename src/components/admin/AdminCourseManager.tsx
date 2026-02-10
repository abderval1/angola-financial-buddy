import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  Trash2,
  GraduationCap,
  BookOpen,
  Video,
  Image,
  Youtube,
  Upload,
  FileText,
  HelpCircle,
  Layers,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  ChevronDown,
  GripVertical,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Link2,
} from "lucide-react";

type MediaType = "text" | "video" | "youtube";

interface Module {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  video_url: string | null;
  media_type: string | null;
  duration_minutes: number | null;
  order_index: number | null;
  is_free: boolean | null;
  has_quiz: boolean | null;
  thumbnail_url: string | null;
  course_id: string;
}

interface Question {
  id?: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
  order_index: number;
}

interface Quiz {
  id: string;
  course_id: string | null;
  module_id: string | null;
  title: string;
  description: string | null;
  passing_score: number | null;
  is_final_quiz: boolean | null;
  is_active: boolean | null;
  order_index: number | null;
  quiz_questions?: any[];
}

export function AdminCourseManager() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeModuleTab, setActiveModuleTab] = useState("content");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Course form
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "financas",
    difficulty_level: "iniciante",
    duration_minutes: 60,
    is_premium: false,
    is_published: false,
    thumbnail_url: "",
    points_reward: 50,
    price: null as number | null,
  });

  // Module form
  const [moduleForm, setModuleForm] = useState({
    title: "",
    description: "",
    content: "",
    video_url: "",
    media_type: "text" as MediaType,
    duration_minutes: 10,
    order_index: 0,
    is_free: false,
    thumbnail_url: "",
  });

  // Quiz form
  const [quizForm, setQuizForm] = useState<{
    title: string;
    description: string;
    passing_score: number;
    is_final_quiz: boolean;
    module_id: string | null;
    questions: Question[];
  }>({
    title: "",
    description: "",
    passing_score: 70,
    is_final_quiz: false,
    module_id: null,
    questions: [],
  });

  // Fetch courses
  const { data: courses = [], isLoading: isLoadingCourses } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("educational_content")
        .select("*")
        .eq("content_type", "course")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch modules for selected course
  const { data: modules = [], isLoading: isLoadingModules } = useQuery({
    queryKey: ["admin-course-modules", selectedCourseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", selectedCourseId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Module[];
    },
    enabled: !!selectedCourseId,
  });

  // Fetch quizzes for selected course
  const { data: quizzes = [] } = useQuery({
    queryKey: ["admin-course-quizzes", selectedCourseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_quizzes")
        .select("*, quiz_questions(*)")
        .eq("course_id", selectedCourseId)
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data as Quiz[];
    },
    enabled: !!selectedCourseId,
  });

  // File upload handler
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "video",
    target: "course" | "module"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `courses/${type}s/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("marketplace")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("marketplace")
        .getPublicUrl(filePath);

      if (target === "course") {
        setCourseForm(prev => ({ ...prev, thumbnail_url: urlData.publicUrl }));
      } else {
        if (type === "image") {
          setModuleForm(prev => ({ ...prev, thumbnail_url: urlData.publicUrl }));
        } else {
          setModuleForm(prev => ({ ...prev, video_url: urlData.publicUrl, media_type: "video" }));
        }
      }
      toast.success(`${type === "image" ? "Imagem" : "Vídeo"} enviado com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  // Course CRUD
  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof courseForm) => {
      const slug = data.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const { error } = await supabase.from("educational_content").insert({
        title: data.title,
        description: data.description,
        category: data.category,
        content_type: "course",
        difficulty_level: data.difficulty_level,
        duration_minutes: data.duration_minutes,
        is_premium: data.is_premium,
        is_published: data.is_published,
        thumbnail_url: data.thumbnail_url || null,
        points_reward: data.points_reward,
        price: data.is_premium ? data.price : null,
        slug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Curso criado com sucesso!");
      resetCourseForm();
    },
    onError: (error: any) => toast.error(error.message || "Erro ao criar curso"),
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof courseForm }) => {
      const { error } = await supabase.from("educational_content").update({
        title: data.title,
        description: data.description,
        category: data.category,
        difficulty_level: data.difficulty_level,
        duration_minutes: data.duration_minutes,
        is_premium: data.is_premium,
        is_published: data.is_published,
        thumbnail_url: data.thumbnail_url || null,
        points_reward: data.points_reward,
        price: data.is_premium ? data.price : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Curso atualizado!");
      resetCourseForm();
    },
    onError: (error: any) => toast.error(error.message || "Erro ao atualizar curso"),
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("educational_content").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      setSelectedCourseId(null);
      toast.success("Curso excluído!");
    },
    onError: (error: any) => toast.error(error.message || "Erro ao excluir curso"),
  });

  // Module CRUD
  const createModuleMutation = useMutation({
    mutationFn: async (data: typeof moduleForm) => {
      const { error } = await supabase.from("course_modules").insert({
        title: data.title,
        description: data.description || null,
        content: data.content || null,
        video_url: data.video_url || null,
        media_type: data.media_type,
        duration_minutes: data.duration_minutes,
        is_free: data.is_free,
        course_id: selectedCourseId!,
        order_index: modules.length,
        thumbnail_url: data.thumbnail_url || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-modules", selectedCourseId] });
      toast.success("Módulo criado!");
      resetModuleForm();
    },
    onError: (error: any) => toast.error(error.message || "Erro ao criar módulo"),
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof moduleForm }) => {
      const { error } = await supabase.from("course_modules").update({
        title: data.title,
        description: data.description || null,
        content: data.content || null,
        video_url: data.video_url || null,
        media_type: data.media_type,
        duration_minutes: data.duration_minutes,
        is_free: data.is_free,
        thumbnail_url: data.thumbnail_url || null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-modules", selectedCourseId] });
      toast.success("Módulo atualizado!");
      resetModuleForm();
    },
    onError: (error: any) => toast.error(error.message || "Erro ao atualizar módulo"),
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_modules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-modules", selectedCourseId] });
      toast.success("Módulo excluído!");
    },
    onError: (error: any) => toast.error(error.message || "Erro ao excluir módulo"),
  });

  // Reorder module
  const reorderModuleMutation = useMutation({
    mutationFn: async ({ id, newIndex }: { id: string; newIndex: number }) => {
      const { error } = await supabase.from("course_modules")
        .update({ order_index: newIndex })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-modules", selectedCourseId] });
    },
  });

  const moveModule = (moduleId: string, direction: "up" | "down") => {
    const currentIndex = modules.findIndex(m => m.id === moduleId);
    if (currentIndex === -1) return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;

    const otherModule = modules[newIndex];

    // Swap order indices
    reorderModuleMutation.mutate({ id: moduleId, newIndex });
    reorderModuleMutation.mutate({ id: otherModule.id, newIndex: currentIndex });
  };

  // Quiz CRUD
  const createQuizMutation = useMutation({
    mutationFn: async (data: typeof quizForm) => {
      const { data: quiz, error: quizError } = await supabase
        .from("course_quizzes")
        .insert({
          course_id: selectedCourseId,
          title: data.title,
          description: data.description || null,
          passing_score: data.passing_score,
          is_final_quiz: data.is_final_quiz,
          is_active: true,
          order_index: quizzes.length,
          module_id: data.is_final_quiz ? null : data.module_id,
        })
        .select()
        .single();

      if (quizError) throw quizError;

      if (data.questions.length > 0) {
        const questions = data.questions.map((q, idx) => ({
          quiz_id: quiz.id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          points: q.points,
          order_index: idx,
        }));

        const { error: questionsError } = await supabase
          .from("quiz_questions")
          .insert(questions);

        if (questionsError) throw questionsError;
      }

      return quiz;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-quizzes", selectedCourseId] });
      toast.success("Quiz criado com sucesso!");
      resetQuizForm();
    },
    onError: (error: any) => toast.error(error.message || "Erro ao criar quiz"),
  });

  const updateQuizMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof quizForm }) => {
      // Update quiz
      const { error: quizError } = await supabase
        .from("course_quizzes")
        .update({
          title: data.title,
          description: data.description || null,
          passing_score: data.passing_score,
          is_final_quiz: data.is_final_quiz,
          module_id: data.is_final_quiz ? null : data.module_id,
        })
        .eq("id", id);

      if (quizError) throw quizError;

      // Delete existing questions
      await supabase.from("quiz_questions").delete().eq("quiz_id", id);

      // Insert new questions
      if (data.questions.length > 0) {
        const questions = data.questions.map((q, idx) => ({
          quiz_id: id,
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation || null,
          points: q.points,
          order_index: idx,
        }));

        const { error: questionsError } = await supabase
          .from("quiz_questions")
          .insert(questions);

        if (questionsError) throw questionsError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-quizzes", selectedCourseId] });
      toast.success("Quiz atualizado!");
      resetQuizForm();
    },
    onError: (error: any) => toast.error(error.message || "Erro ao atualizar quiz"),
  });

  const deleteQuizMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("course_quizzes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-quizzes", selectedCourseId] });
      toast.success("Quiz excluído!");
    },
    onError: (error: any) => toast.error(error.message || "Erro ao excluir quiz"),
  });

  // Reset forms
  const resetCourseForm = () => {
    setCourseDialogOpen(false);
    setEditingCourse(null);
    setCourseForm({
      title: "",
      description: "",
      category: "financas",
      difficulty_level: "iniciante",
      duration_minutes: 60,
      is_premium: false,
      is_published: false,
      thumbnail_url: "",
      points_reward: 50,
      price: null,
    });
  };

  const resetModuleForm = () => {
    setModuleDialogOpen(false);
    setEditingModule(null);
    setActiveModuleTab("content");
    setModuleForm({
      title: "",
      description: "",
      content: "",
      video_url: "",
      media_type: "text",
      duration_minutes: 10,
      order_index: 0,
      is_free: false,
      thumbnail_url: "",
    });
  };

  const resetQuizForm = () => {
    setQuizDialogOpen(false);
    setEditingQuiz(null);
    setQuizForm({
      title: "",
      description: "",
      passing_score: 70,
      is_final_quiz: false,
      module_id: null,
      questions: [],
    });
  };

  // Open edit dialogs
  const openEditCourse = (course: any) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "financas",
      difficulty_level: course.difficulty_level || "iniciante",
      duration_minutes: course.duration_minutes || 60,
      is_premium: course.is_premium || false,
      is_published: course.is_published || false,
      thumbnail_url: course.thumbnail_url || "",
      points_reward: course.points_reward || 50,
      price: course.price || null,
    });
    setCourseDialogOpen(true);
  };

  const openEditModule = (mod: Module) => {
    setEditingModule(mod);
    setModuleForm({
      title: mod.title || "",
      description: mod.description || "",
      content: mod.content || "",
      video_url: mod.video_url || "",
      media_type: (mod.media_type as MediaType) || "text",
      duration_minutes: mod.duration_minutes || 10,
      order_index: mod.order_index || 0,
      is_free: mod.is_free || false,
      thumbnail_url: mod.thumbnail_url || "",
    });
    setModuleDialogOpen(true);
  };

  const openEditQuiz = (quiz: Quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      title: quiz.title || "",
      description: quiz.description || "",
      passing_score: quiz.passing_score || 70,
      is_final_quiz: quiz.is_final_quiz || false,
      module_id: quiz.module_id || null,
      questions: (quiz.quiz_questions || []).map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type || "multiple_choice",
        options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
        correct_answer: q.correct_answer,
        explanation: q.explanation || "",
        points: q.points || 10,
        order_index: q.order_index || 0,
      })),
    });
    setQuizDialogOpen(true);
  };

  // Submit handlers
  const handleCourseSubmit = () => {
    if (!courseForm.title.trim()) {
      toast.error("O título do curso é obrigatório");
      return;
    }
    // Validate price for premium courses
    if (courseForm.is_premium && (!courseForm.price || courseForm.price <= 0)) {
      toast.error("O preço é obrigatório para cursos premium");
      return;
    }
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseForm });
    } else {
      createCourseMutation.mutate(courseForm);
    }
  };

  const handleModuleSubmit = () => {
    if (!moduleForm.title.trim()) {
      toast.error("O título do módulo é obrigatório");
      return;
    }
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data: moduleForm });
    } else {
      createModuleMutation.mutate(moduleForm);
    }
  };

  const handleQuizSubmit = () => {
    if (!quizForm.title.trim()) {
      toast.error("O título do quiz é obrigatório");
      return;
    }
    if (quizForm.questions.length === 0) {
      toast.error("Adicione pelo menos uma questão");
      return;
    }
    if (editingQuiz) {
      updateQuizMutation.mutate({ id: editingQuiz.id, data: quizForm });
    } else {
      createQuizMutation.mutate(quizForm);
    }
  };

  // Quiz questions management
  const addQuestion = () => {
    setQuizForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question_text: "",
          question_type: "multiple_choice",
          options: ["", "", "", ""],
          correct_answer: "",
          explanation: "",
          points: 10,
          order_index: prev.questions.length,
        },
      ],
    }));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? { ...q, options: q.options.map((opt, oi) => oi === optionIndex ? value : opt) }
          : q
      ),
    }));
  };

  const removeQuestion = (index: number) => {
    setQuizForm(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const toggleModuleExpanded = (moduleId: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const selectedCourse = courses.find((c: any) => c.id === selectedCourseId);

  // Calculate total duration from modules
  const totalModulesDuration = modules.reduce((acc, m) => acc + (m.duration_minutes || 0), 0);

  // Extract YouTube video ID
  const getYoutubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : url;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            Gestão de Cursos
          </h1>
          <p className="text-muted-foreground">Crie e gerencie cursos, módulos e quizzes como num LMS profissional</p>
        </div>
        <Button onClick={() => setCourseDialogOpen(true)} className="gradient-primary">
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Courses Sidebar */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Cursos ({courses.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px]">
                {isLoadingCourses ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Carregando...
                  </div>
                ) : courses.length === 0 ? (
                  <div className="p-6 text-center">
                    <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum curso criado</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3"
                      onClick={() => setCourseDialogOpen(true)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Criar primeiro curso
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y">
                    {courses.map((course: any) => (
                      <div
                        key={course.id}
                        className={`p-3 cursor-pointer transition-all hover:bg-muted/50 ${selectedCourseId === course.id ? "bg-primary/5 border-l-2 border-l-primary" : ""
                          }`}
                        onClick={() => setSelectedCourseId(course.id)}
                      >
                        <div className="flex items-start gap-3">
                          {course.thumbnail_url ? (
                            <img
                              src={course.thumbnail_url}
                              alt=""
                              className="h-12 w-16 rounded object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <GraduationCap className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{course.title}</h4>
                            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                              {course.is_published ? (
                                <Badge variant="outline" className="text-[10px] h-5 bg-success/10 text-success border-success/20">
                                  <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                                  Publicado
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px] h-5">
                                  <EyeOff className="h-2.5 w-2.5 mr-0.5" />
                                  Rascunho
                                </Badge>
                              )}
                              {course.is_premium && (
                                <Badge className="text-[10px] h-5 bg-amber-500/10 text-amber-600 border-amber-500/20">
                                  <Star className="h-2.5 w-2.5 mr-0.5" />
                                  Premium
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Course Editor */}
        <div className="lg:col-span-2">
          {!selectedCourse ? (
            <Card>
              <CardContent className="py-16 text-center">
                <GraduationCap className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Selecione um curso</h3>
                <p className="text-muted-foreground mb-4">
                  Escolha um curso na lista ao lado ou crie um novo para começar
                </p>
                <Button onClick={() => setCourseDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Novo Curso
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Course Header */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {selectedCourse.thumbnail_url ? (
                        <img
                          src={selectedCourse.thumbnail_url}
                          alt=""
                          className="h-20 w-28 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-20 w-28 rounded-lg bg-muted flex items-center justify-center">
                          <GraduationCap className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {selectedCourse.description || "Sem descrição"}
                        </p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline">{selectedCourse.category}</Badge>
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            {totalModulesDuration || selectedCourse.duration_minutes} min
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <Layers className="h-3 w-3" />
                            {modules.length} módulos
                          </Badge>
                          <Badge variant="outline" className="gap-1">
                            <HelpCircle className="h-3 w-3" />
                            {quizzes.length} quizzes
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditCourse(selectedCourse)}>
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir este curso?")) {
                            deleteCourseMutation.mutate(selectedCourse.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Modules & Quizzes Tabs */}
              <Tabs defaultValue="modules">
                <div className="flex items-center justify-between mb-4">
                  <TabsList>
                    <TabsTrigger value="modules" className="gap-2">
                      <Layers className="h-4 w-4" />
                      Módulos ({modules.length})
                    </TabsTrigger>
                    <TabsTrigger value="quizzes" className="gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Quizzes ({quizzes.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Modules Tab */}
                <TabsContent value="modules" className="space-y-3 mt-0">
                  {/* Add Module Button */}
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Organize os módulos do curso. Cada módulo pode ter texto rico, vídeos e materiais.
                    </p>
                    <Button size="sm" onClick={() => setModuleDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Novo Módulo
                    </Button>
                  </div>

                  {isLoadingModules ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Carregando módulos...
                      </CardContent>
                    </Card>
                  ) : modules.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Layers className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground mb-3">Nenhum módulo criado</p>
                        <p className="text-sm text-muted-foreground mb-4">
                          Comece adicionando módulos ao seu curso. Cada módulo pode conter texto, vídeos e quizzes.
                        </p>
                        <Button size="sm" onClick={() => setModuleDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Criar primeiro módulo
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {modules.map((mod, idx) => (
                        <Card key={mod.id} className="overflow-hidden border-l-4 border-l-primary/30 hover:border-l-primary transition-colors">
                          <div className="p-4">
                            <div className="flex items-start gap-3">
                              {/* Order Controls */}
                              <div className="flex flex-col items-center gap-0.5 pt-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveModule(mod.id, "up")}
                                  disabled={idx === 0}
                                >
                                  <ArrowUp className="h-3 w-3" />
                                </Button>
                                <span className="text-xs font-bold text-muted-foreground">{idx + 1}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => moveModule(mod.id, "down")}
                                  disabled={idx === modules.length - 1}
                                >
                                  <ArrowDown className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Thumbnail */}
                              {mod.thumbnail_url ? (
                                <img
                                  src={mod.thumbnail_url}
                                  alt=""
                                  className="h-16 w-24 rounded-lg object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                  {mod.media_type === "youtube" ? (
                                    <Youtube className="h-6 w-6 text-red-500" />
                                  ) : mod.media_type === "video" ? (
                                    <Video className="h-6 w-6 text-blue-500" />
                                  ) : (
                                    <FileText className="h-6 w-6 text-muted-foreground" />
                                  )}
                                </div>
                              )}

                              {/* Content Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <div>
                                    <h4 className="font-semibold">{mod.title}</h4>
                                    {mod.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                                        {mod.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 ml-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => toggleModuleExpanded(mod.id)}
                                    >
                                      {expandedModules.has(mod.id) ? (
                                        <>
                                          <ChevronDown className="h-4 w-4 mr-1" />
                                          Fechar
                                        </>
                                      ) : (
                                        <>
                                          <Eye className="h-4 w-4 mr-1" />
                                          Ver
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-8"
                                      onClick={() => openEditModule(mod)}
                                    >
                                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                                      Editar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-destructive hover:text-destructive"
                                      onClick={() => {
                                        if (confirm("Excluir este módulo?")) {
                                          deleteModuleMutation.mutate(mod.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Module Meta */}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="outline" className="text-xs h-5 gap-1">
                                    {mod.media_type === "youtube" ? (
                                      <><Youtube className="h-2.5 w-2.5" /> YouTube</>
                                    ) : mod.media_type === "video" ? (
                                      <><Video className="h-2.5 w-2.5" /> Vídeo</>
                                    ) : (
                                      <><FileText className="h-2.5 w-2.5" /> Texto</>
                                    )}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs h-5 gap-1">
                                    <Clock className="h-2.5 w-2.5" />
                                    {mod.duration_minutes || 0} min
                                  </Badge>
                                  {mod.is_free && (
                                    <Badge className="text-xs h-5 bg-success/10 text-success border-success/20">
                                      Gratuito
                                    </Badge>
                                  )}
                                  {mod.content && (
                                    <Badge variant="secondary" className="text-xs h-5">
                                      <FileText className="h-2.5 w-2.5 mr-0.5" />
                                      Conteúdo
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Expanded Content Preview */}
                            {expandedModules.has(mod.id) && (
                              <div className="mt-4 pt-4 border-t bg-muted/20 rounded-lg p-4 -mx-4 -mb-4">
                                {mod.description && (
                                  <p className="text-sm text-muted-foreground mb-4 italic">"{mod.description}"</p>
                                )}

                                {/* Video/YouTube Preview */}
                                {mod.media_type === "youtube" && mod.video_url && (
                                  <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4 max-w-2xl">
                                    <iframe
                                      src={getYoutubeEmbedUrl(mod.video_url)}
                                      className="w-full h-full"
                                      allowFullScreen
                                    />
                                  </div>
                                )}
                                {mod.media_type === "video" && mod.video_url && (
                                  <div className="aspect-video rounded-lg overflow-hidden bg-black mb-4 max-w-2xl">
                                    <video src={mod.video_url} controls className="w-full h-full" />
                                  </div>
                                )}

                                {/* Content Preview */}
                                {mod.content && (
                                  <div className="bg-background rounded-lg p-4 border">
                                    <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                                      <FileText className="h-4 w-4" />
                                      Conteúdo do Módulo
                                    </h5>
                                    <ScrollArea className="max-h-[300px]">
                                      <div
                                        className="prose prose-sm dark:prose-invert max-w-none"
                                        dangerouslySetInnerHTML={{ __html: mod.content }}
                                      />
                                    </ScrollArea>
                                  </div>
                                )}

                                {!mod.content && !mod.video_url && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">Este módulo ainda não tem conteúdo</p>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => openEditModule(mod)}
                                    >
                                      <Edit2 className="h-3.5 w-3.5 mr-1" />
                                      Adicionar Conteúdo
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}

                      {/* Summary Card */}
                      <Card className="bg-muted/30">
                        <CardContent className="py-3 px-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">
                              Total: {modules.length} módulos • {totalModulesDuration} minutos de conteúdo
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setModuleDialogOpen(true)}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Adicionar mais
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </TabsContent>

                {/* Quizzes Tab */}
                <TabsContent value="quizzes" className="space-y-2 mt-0">
                  <div className="flex justify-end mb-2">
                    <Button size="sm" onClick={() => setQuizDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-1" />
                      Novo Quiz
                    </Button>
                  </div>

                  {quizzes.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground mb-3">Nenhum quiz criado</p>
                        <Button size="sm" onClick={() => setQuizDialogOpen(true)}>
                          <Plus className="h-4 w-4 mr-1" />
                          Criar primeiro quiz
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    quizzes.map((quiz) => (
                      <Card key={quiz.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <HelpCircle className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{quiz.title}</h4>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                                  <span>{quiz.quiz_questions?.length || 0} questões</span>
                                  <span>•</span>
                                  <span>Nota mínima: {quiz.passing_score}%</span>
                                  {quiz.is_final_quiz ? (
                                    <Badge className="text-[10px] h-5 bg-primary/10 text-primary">
                                      Quiz Final
                                    </Badge>
                                  ) : quiz.module_id ? (
                                    <Badge variant="outline" className="text-[10px] h-5 bg-muted/50 border-muted-foreground/20">
                                      <Link2 className="h-2.5 w-2.5 mr-1" />
                                      Pós: {modules.find(m => m.id === quiz.module_id)?.title || "Módulo não encontrado"}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] h-5 text-muted-foreground">
                                      Geral (Curso)
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditQuiz(quiz)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => {
                                  if (confirm("Excluir este quiz?")) {
                                    deleteQuizMutation.mutate(quiz.id);
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Editar Curso" : "Novo Curso"}</DialogTitle>
            <DialogDescription>
              {editingCourse ? "Atualize as informações do curso" : "Preencha os dados para criar um novo curso"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título do Curso *</Label>
                <Input
                  value={courseForm.title}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  placeholder="Ex: Finanças Pessoais para Iniciantes"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={courseForm.category}
                  onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="financas">Finanças Pessoais</SelectItem>
                    <SelectItem value="investimentos">Investimentos</SelectItem>
                    <SelectItem value="negocios">Negócios</SelectItem>
                    <SelectItem value="economia">Economia</SelectItem>
                    <SelectItem value="budgeting">Orçamento</SelectItem>
                    <SelectItem value="savings">Poupança</SelectItem>
                    <SelectItem value="debt">Dívidas</SelectItem>
                    <SelectItem value="fire">FIRE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Descrição detalhada do curso..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Dificuldade</Label>
                <Select
                  value={courseForm.difficulty_level}
                  onValueChange={(value) => setCourseForm({ ...courseForm, difficulty_level: value })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciante">Iniciante</SelectItem>
                    <SelectItem value="intermediario">Intermediário</SelectItem>
                    <SelectItem value="avancado">Avançado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Duração (min)</Label>
                <Input
                  type="number"
                  value={courseForm.duration_minutes}
                  onChange={(e) => setCourseForm({ ...courseForm, duration_minutes: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Pontos de Recompensa</Label>
                <Input
                  type="number"
                  value={courseForm.points_reward}
                  onChange={(e) => setCourseForm({ ...courseForm, points_reward: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Imagem de Capa</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={courseForm.thumbnail_url}
                  onChange={(e) => setCourseForm({ ...courseForm, thumbnail_url: e.target.value })}
                  placeholder="URL da imagem ou faça upload"
                  className="flex-1"
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "image", "course")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {uploading ? "Enviando..." : "Upload"}
                </Button>
              </div>
              {courseForm.thumbnail_url && (
                <img src={courseForm.thumbnail_url} alt="Preview" className="h-24 rounded-lg mt-2 object-cover" />
              )}
            </div>

            <Separator />

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={courseForm.is_premium}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_premium: checked, price: checked ? courseForm.price : null })}
                />
                <Label className="cursor-pointer">Curso Premium (Venda Separada)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={courseForm.is_published}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_published: checked })}
                />
                <Label className="cursor-pointer">Publicar Curso</Label>
              </div>
            </div>

            {/* Price field - only shown when is_premium is checked */}
            {courseForm.is_premium && (
              <div className="p-4 border border-amber-500/30 rounded-lg bg-amber-500/5 space-y-3">
                <div className="flex items-center gap-2 text-amber-600">
                  <Star className="h-4 w-4" />
                  <span className="font-medium text-sm">Configuração de Curso Premium</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Este curso será vendido separadamente e não estará incluído em nenhum plano de assinatura.
                </p>
                <div className="space-y-2">
                  <Label>Preço do Curso (Kz) *</Label>
                  <Input
                    type="number"
                    value={courseForm.price || ""}
                    onChange={(e) => setCourseForm({ ...courseForm, price: e.target.value ? parseFloat(e.target.value) : null })}
                    placeholder="Ex: 15000"
                    min="0"
                    step="100"
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCourseForm}>Cancelar</Button>
            <Button
              onClick={handleCourseSubmit}
              disabled={
                !courseForm.title.trim() ||
                (courseForm.is_premium && (!courseForm.price || courseForm.price <= 0)) ||
                createCourseMutation.isPending ||
                updateCourseMutation.isPending
              }
            >
              <Save className="h-4 w-4 mr-2" />
              {editingCourse ? "Salvar Alterações" : "Criar Curso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog - WYSIWYG Editor */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
            <DialogDescription>
              Configure o conteúdo do módulo com texto rico, vídeos ou YouTube
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeModuleTab} onValueChange={setActiveModuleTab} className="mt-4">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="content" className="gap-2">
                <FileText className="h-4 w-4" />
                Conteúdo
              </TabsTrigger>
              <TabsTrigger value="media" className="gap-2">
                <Video className="h-4 w-4" />
                Mídia
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Settings className="h-4 w-4" />
                Configurações
              </TabsTrigger>
            </TabsList>

            <div className="mt-4">
              <TabsContent value="content" className="m-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título do Módulo *</Label>
                    <Input
                      value={moduleForm.title}
                      onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                      placeholder="Ex: Introdução ao Orçamento Pessoal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Duração (minutos)</Label>
                    <Input
                      type="number"
                      value={moduleForm.duration_minutes}
                      onChange={(e) => setModuleForm({ ...moduleForm, duration_minutes: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Descrição Breve</Label>
                  <Textarea
                    value={moduleForm.description}
                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                    placeholder="Breve descrição do que será abordado neste módulo..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Conteúdo do Módulo (Editor WYSIWYG)</Label>
                  <RichTextEditor
                    content={moduleForm.content}
                    onChange={(content) => setModuleForm({ ...moduleForm, content })}
                    placeholder="Digite o conteúdo do módulo aqui..."
                    className="min-h-[400px]"
                    maxHeight="500px"
                  />
                </div>
              </TabsContent>

              <TabsContent value="media" className="m-0 space-y-4">
                <div className="space-y-2">
                  <Label>Tipo de Mídia</Label>
                  <Select
                    value={moduleForm.media_type}
                    onValueChange={(value: MediaType) => setModuleForm({ ...moduleForm, media_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Apenas Texto
                        </div>
                      </SelectItem>
                      <SelectItem value="video">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Vídeo (Upload)
                        </div>
                      </SelectItem>
                      <SelectItem value="youtube">
                        <div className="flex items-center gap-2">
                          <Youtube className="h-4 w-4" />
                          YouTube (Embed)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {moduleForm.media_type === "video" && (
                  <div className="space-y-2">
                    <Label>Vídeo</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={moduleForm.video_url}
                        onChange={(e) => setModuleForm({ ...moduleForm, video_url: e.target.value })}
                        placeholder="URL do vídeo ou faça upload"
                        className="flex-1"
                      />
                      <input
                        ref={videoInputRef}
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e, "video", "module")}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={uploading}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Enviando..." : "Upload Vídeo"}
                      </Button>
                    </div>
                    {moduleForm.video_url && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black mt-2">
                        <video src={moduleForm.video_url} controls className="w-full h-full" />
                      </div>
                    )}
                  </div>
                )}

                {moduleForm.media_type === "youtube" && (
                  <div className="space-y-2">
                    <Label>URL do YouTube</Label>
                    <Input
                      value={moduleForm.video_url}
                      onChange={(e) => setModuleForm({ ...moduleForm, video_url: e.target.value })}
                      placeholder="https://youtube.com/watch?v=... ou https://youtu.be/..."
                    />
                    {moduleForm.video_url && (
                      <div className="aspect-video rounded-lg overflow-hidden bg-black mt-2">
                        <iframe
                          src={getYoutubeEmbedUrl(moduleForm.video_url)}
                          className="w-full h-full"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Thumbnail do Módulo (opcional)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={moduleForm.thumbnail_url}
                      onChange={(e) => setModuleForm({ ...moduleForm, thumbnail_url: e.target.value })}
                      placeholder="URL da imagem"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  {moduleForm.thumbnail_url && (
                    <img src={moduleForm.thumbnail_url} alt="Preview" className="h-20 rounded-lg mt-2 object-cover" />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="settings" className="m-0 space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Módulo Gratuito</Label>
                        <p className="text-sm text-muted-foreground">
                          Permitir acesso a este módulo sem assinatura premium
                        </p>
                      </div>
                      <Switch
                        checked={moduleForm.is_free}
                        onCheckedChange={(checked) => setModuleForm({ ...moduleForm, is_free: checked })}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={resetModuleForm}>Cancelar</Button>
            <Button
              onClick={handleModuleSubmit}
              disabled={!moduleForm.title.trim() || createModuleMutation.isPending || updateModuleMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingModule ? "Salvar Alterações" : "Criar Módulo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuiz ? "Editar Quiz" : "Novo Quiz"}</DialogTitle>
            <DialogDescription>
              Configure as questões do quiz para avaliar o aprendizado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título do Quiz *</Label>
                <Input
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="Ex: Avaliação do Módulo 1"
                />
              </div>
              <div className="space-y-2">
                <Label>Nota Mínima (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={quizForm.passing_score}
                  onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 70 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder="Instruções ou descrição do quiz..."
                rows={2}
              />
            </div>

            <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Posicionamento do Quiz
              </h4>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="final-quiz"
                    checked={quizForm.is_final_quiz}
                    onCheckedChange={(checked) => setQuizForm({ ...quizForm, is_final_quiz: checked, module_id: checked ? null : quizForm.module_id })}
                  />
                  <Label htmlFor="final-quiz" className="cursor-pointer">Este é o Quiz Final do Curso</Label>
                </div>

                {!quizForm.is_final_quiz && (
                  <div className="space-y-2">
                    <Label>Vincular a um Módulo (Opcional)</Label>
                    <Select
                      value={quizForm.module_id || "none"}
                      onValueChange={(value) => setQuizForm({ ...quizForm, module_id: value === "none" ? null : value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um módulo..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (Apenas curso)</SelectItem>
                        {modules.map((mod) => (
                          <SelectItem key={mod.id} value={mod.id}>
                            {mod.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Se selecionado, o quiz aparecerá logo após este módulo.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">Questões ({quizForm.questions.length})</Label>
                <Button size="sm" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar Questão
                </Button>
              </div>

              {quizForm.questions.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma questão adicionada</p>
                  </CardContent>
                </Card>
              ) : (
                quizForm.questions.map((question, qIdx) => (
                  <Card key={qIdx}>
                    <CardHeader className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium">Questão {qIdx + 1}</CardTitle>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive h-7"
                          onClick={() => removeQuestion(qIdx)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3 px-4 space-y-3">
                      <div className="space-y-2">
                        <Label className="text-xs">Pergunta</Label>
                        <Input
                          value={question.question_text}
                          onChange={(e) => updateQuestion(qIdx, "question_text", e.target.value)}
                          placeholder="Digite a pergunta..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {question.options.map((opt, oIdx) => (
                          <div key={oIdx} className="space-y-1">
                            <Label className="text-xs">Opção {String.fromCharCode(65 + oIdx)}</Label>
                            <Input
                              value={opt}
                              onChange={(e) => updateQuestionOption(qIdx, oIdx, e.target.value)}
                              placeholder={`Opção ${String.fromCharCode(65 + oIdx)}`}
                              className="text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <Label className="text-xs">Resposta Correta</Label>
                          <Select
                            value={question.correct_answer}
                            onValueChange={(value) => updateQuestion(qIdx, "correct_answer", value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                              {question.options.map((opt, oIdx) => (
                                opt && (
                                  <SelectItem key={oIdx} value={opt}>
                                    {String.fromCharCode(65 + oIdx)}: {opt.substring(0, 30)}...
                                  </SelectItem>
                                )
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Pontos</Label>
                          <Input
                            type="number"
                            min={1}
                            value={question.points}
                            onChange={(e) => updateQuestion(qIdx, "points", parseInt(e.target.value) || 10)}
                            className="text-sm"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Explicação (opcional)</Label>
                        <Textarea
                          value={question.explanation}
                          onChange={(e) => updateQuestion(qIdx, "explanation", e.target.value)}
                          placeholder="Explicação da resposta correta..."
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )))}
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={resetQuizForm}>Cancelar</Button>
            <Button
              onClick={handleQuizSubmit}
              disabled={!quizForm.title.trim() || quizForm.questions.length === 0 || createQuizMutation.isPending || updateQuizMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {editingQuiz ? "Salvar Alterações" : "Criar Quiz"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
