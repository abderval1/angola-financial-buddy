import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
} from "lucide-react";

interface Module {
  id: string;
  title: string;
  description: string;
  content: string;
  video_url: string;
  media_type: string;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
  has_quiz: boolean;
  thumbnail_url: string;
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

export function AdminCourseManager() {
  const queryClient = useQueryClient();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

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
  });

  // Module form
  const [moduleForm, setModuleForm] = useState<Partial<Module>>({
    title: "",
    description: "",
    content: "",
    video_url: "",
    media_type: "text",
    duration_minutes: 10,
    order_index: 0,
    is_free: false,
    has_quiz: false,
    thumbnail_url: "",
  });

  // Quiz form
  const [quizForm, setQuizForm] = useState<{
    title: string;
    description: string;
    passing_score: number;
    is_final_quiz: boolean;
    questions: Question[];
  }>({
    title: "",
    description: "",
    passing_score: 70,
    is_final_quiz: false,
    questions: [],
  });

  // Fetch courses
  const { data: courses = [] } = useQuery({
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
  const { data: modules = [] } = useQuery({
    queryKey: ["admin-course-modules", selectedCourseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", selectedCourseId)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data;
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
      return data;
    },
    enabled: !!selectedCourseId,
  });

  // File upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "thumbnail_url" | "video_url", target: "course" | "module") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `courses/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("marketplace")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("marketplace")
        .getPublicUrl(filePath);

      if (target === "course") {
        setCourseForm(prev => ({ ...prev, [field]: urlData.publicUrl }));
      } else {
        setModuleForm(prev => ({ ...prev, [field]: urlData.publicUrl }));
      }
      toast.success("Arquivo enviado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  // Course mutations
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
        thumbnail_url: data.thumbnail_url,
        points_reward: data.points_reward,
        slug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Curso criado!");
      resetCourseForm();
    },
    onError: () => toast.error("Erro ao criar curso"),
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
        thumbnail_url: data.thumbnail_url,
        points_reward: data.points_reward,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
      toast.success("Curso atualizado!");
      resetCourseForm();
    },
    onError: () => toast.error("Erro ao atualizar curso"),
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
    onError: () => toast.error("Erro ao excluir curso"),
  });

  // Module mutations
  const createModuleMutation = useMutation({
    mutationFn: async (data: Partial<Module>) => {
      const { error } = await supabase.from("course_modules").insert({
        title: data.title || "",
        description: data.description || null,
        content: data.content || null,
        video_url: data.video_url || null,
        duration_minutes: data.duration_minutes || 0,
        is_free: data.is_free || false,
        course_id: selectedCourseId!,
        order_index: modules.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-modules", selectedCourseId] });
      toast.success("Módulo criado!");
      resetModuleForm();
    },
    onError: () => toast.error("Erro ao criar módulo"),
  });

  const updateModuleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Module> }) => {
      const { error } = await supabase.from("course_modules").update({
        title: data.title || "",
        description: data.description || null,
        content: data.content || null,
        video_url: data.video_url || null,
        duration_minutes: data.duration_minutes || 0,
        is_free: data.is_free || false,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-course-modules", selectedCourseId] });
      toast.success("Módulo atualizado!");
      resetModuleForm();
    },
    onError: () => toast.error("Erro ao atualizar módulo"),
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
    onError: () => toast.error("Erro ao excluir módulo"),
  });

  // Quiz mutations
  const createQuizMutation = useMutation({
    mutationFn: async (data: typeof quizForm) => {
      const { data: quiz, error: quizError } = await supabase
        .from("course_quizzes")
        .insert({
          course_id: selectedCourseId,
          title: data.title,
          description: data.description,
          passing_score: data.passing_score,
          is_final_quiz: data.is_final_quiz,
          order_index: quizzes.length,
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
          explanation: q.explanation,
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
      toast.success("Quiz criado!");
      resetQuizForm();
    },
    onError: () => toast.error("Erro ao criar quiz"),
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
    onError: () => toast.error("Erro ao excluir quiz"),
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
    });
  };

  const resetModuleForm = () => {
    setModuleDialogOpen(false);
    setEditingModule(null);
    setModuleForm({
      title: "",
      description: "",
      content: "",
      video_url: "",
      media_type: "text",
      duration_minutes: 10,
      order_index: 0,
      is_free: false,
      has_quiz: false,
      thumbnail_url: "",
    });
  };

  const resetQuizForm = () => {
    setQuizDialogOpen(false);
    setQuizForm({
      title: "",
      description: "",
      passing_score: 70,
      is_final_quiz: false,
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
    });
    setCourseDialogOpen(true);
  };

  const openEditModule = (mod: any) => {
    setEditingModule(mod);
    setModuleForm({
      title: mod.title || "",
      description: mod.description || "",
      content: mod.content || "",
      video_url: mod.video_url || "",
      media_type: mod.media_type || "text",
      duration_minutes: mod.duration_minutes || 10,
      order_index: mod.order_index || 0,
      is_free: mod.is_free || false,
      has_quiz: mod.has_quiz || false,
      thumbnail_url: mod.thumbnail_url || "",
    });
    setModuleDialogOpen(true);
  };

  // Submit handlers
  const handleCourseSubmit = () => {
    if (editingCourse) {
      updateCourseMutation.mutate({ id: editingCourse.id, data: courseForm });
    } else {
      createCourseMutation.mutate(courseForm);
    }
  };

  const handleModuleSubmit = () => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data: moduleForm as Module });
    } else {
      createModuleMutation.mutate(moduleForm);
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

  const selectedCourse = courses.find((c: any) => c.id === selectedCourseId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Gestão de Cursos</h1>
          <p className="text-muted-foreground">Crie e gerencie cursos, módulos e quizzes</p>
        </div>
        <Button onClick={() => setCourseDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Curso
        </Button>
      </div>

      {/* Courses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Cursos ({courses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum curso criado ainda</p>
              <Button className="mt-4" onClick={() => setCourseDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Curso
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {courses.map((course: any) => (
                <div
                  key={course.id}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    selectedCourseId === course.id 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedCourseId(course.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {course.thumbnail_url ? (
                        <img src={course.thumbnail_url} alt="" className="h-12 w-16 rounded object-cover" />
                      ) : (
                        <div className="h-12 w-16 rounded bg-muted flex items-center justify-center">
                          <GraduationCap className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Badge variant="outline" className="text-xs">{course.category}</Badge>
                          <span>{course.duration_minutes || 0} min</span>
                          {course.is_premium && (
                            <Badge className="bg-amber-500/10 text-amber-600 text-xs">Premium</Badge>
                          )}
                          {course.is_published ? (
                            <Badge className="bg-success/10 text-success text-xs">Publicado</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Rascunho</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditCourse(course); }}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteCourseMutation.mutate(course.id); }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Course Management */}
      {selectedCourse && (
        <Tabs defaultValue="modules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Gerenciando: {selectedCourse.title}</h2>
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
          <TabsContent value="modules" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setModuleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Módulo
              </Button>
            </div>

            {modules.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum módulo criado ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {modules.map((mod: any, idx: number) => (
                  <Card key={mod.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-primary">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="font-medium">{mod.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              {mod.video_url?.includes("youtube") ? (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Youtube className="h-3 w-3" /> YouTube
                                </Badge>
                              ) : mod.video_url ? (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <Video className="h-3 w-3" /> Vídeo
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs gap-1">
                                  <FileText className="h-3 w-3" /> Texto
                                </Badge>
                              )}
                              {mod.duration_minutes && <span>{mod.duration_minutes} min</span>}
                              {mod.is_free && (
                                <Badge className="bg-success/10 text-success text-xs">Gratuito</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => openEditModule(mod)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteModuleMutation.mutate(mod.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setQuizDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Quiz
              </Button>
            </div>

            {quizzes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <HelpCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum quiz criado ainda</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {quizzes.map((quiz: any) => (
                  <Card key={quiz.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <HelpCircle className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-medium">{quiz.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{quiz.quiz_questions?.length || 0} questões</span>
                              <span>•</span>
                              <span>Nota mínima: {quiz.passing_score}%</span>
                              {quiz.is_final_quiz && (
                                <Badge className="bg-primary/10 text-primary text-xs">Final</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => deleteQuizMutation.mutate(quiz.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Course Dialog */}
      <Dialog open={courseDialogOpen} onOpenChange={setCourseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Editar Curso" : "Novo Curso"}</DialogTitle>
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
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Descrição do curso..."
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
                <Label>Pontos</Label>
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
                  placeholder="URL da imagem"
                  className="flex-1"
                />
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, "thumbnail_url", "course")}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => thumbInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              </div>
              {courseForm.thumbnail_url && (
                <img src={courseForm.thumbnail_url} alt="Preview" className="h-24 rounded-lg mt-2 object-cover" />
              )}
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={courseForm.is_premium}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_premium: checked })}
                />
                <Label>Curso Premium</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={courseForm.is_published}
                  onCheckedChange={(checked) => setCourseForm({ ...courseForm, is_published: checked })}
                />
                <Label>Publicar</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetCourseForm}>Cancelar</Button>
            <Button onClick={handleCourseSubmit} disabled={!courseForm.title}>
              {editingCourse ? "Atualizar" : "Criar Curso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Module Dialog */}
      <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingModule ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título do Módulo *</Label>
                <Input
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  placeholder="Ex: Introdução ao Orçamento"
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
              <Label>Descrição</Label>
              <Textarea
                value={moduleForm.description}
                onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                placeholder="Breve descrição do módulo"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Mídia</Label>
              <Select
                value={moduleForm.media_type}
                onValueChange={(value) => setModuleForm({ ...moduleForm, media_type: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">
                    <div className="flex items-center gap-2"><FileText className="h-4 w-4" /> Texto</div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2"><Video className="h-4 w-4" /> Vídeo (Upload)</div>
                  </SelectItem>
                  <SelectItem value="youtube">
                    <div className="flex items-center gap-2"><Youtube className="h-4 w-4" /> YouTube</div>
                  </SelectItem>
                  <SelectItem value="mixed">
                    <div className="flex items-center gap-2"><Layers className="h-4 w-4" /> Misto</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(moduleForm.media_type === "youtube" || moduleForm.media_type === "video" || moduleForm.media_type === "mixed") && (
              <div className="space-y-2">
                <Label>{moduleForm.media_type === "youtube" ? "URL do YouTube" : "URL do Vídeo"}</Label>
                {moduleForm.media_type === "youtube" ? (
                  <Input
                    value={moduleForm.video_url}
                    onChange={(e) => setModuleForm({ ...moduleForm, video_url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={moduleForm.video_url}
                      onChange={(e) => setModuleForm({ ...moduleForm, video_url: e.target.value })}
                      placeholder="URL do vídeo"
                      className="flex-1"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "video_url", "module")}
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
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Conteúdo do Módulo</Label>
              <Textarea
                value={moduleForm.content}
                onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                placeholder="Conteúdo em texto/HTML do módulo..."
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">Suporta HTML para formatação</p>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={moduleForm.is_free}
                onCheckedChange={(checked) => setModuleForm({ ...moduleForm, is_free: checked })}
              />
              <Label>Módulo Gratuito (preview)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetModuleForm}>Cancelar</Button>
            <Button onClick={handleModuleSubmit} disabled={!moduleForm.title}>
              {editingModule ? "Atualizar" : "Criar Módulo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quiz Dialog */}
      <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Novo Quiz</DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Título do Quiz *</Label>
                <Input
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="Ex: Avaliação Final"
                />
              </div>
              <div className="space-y-2">
                <Label>Nota Mínima (%)</Label>
                <Input
                  type="number"
                  value={quizForm.passing_score}
                  onChange={(e) => setQuizForm({ ...quizForm, passing_score: parseInt(e.target.value) || 70 })}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={quizForm.description}
                onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder="Instruções do quiz"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={quizForm.is_final_quiz}
                onCheckedChange={(checked) => setQuizForm({ ...quizForm, is_final_quiz: checked })}
              />
              <Label>Quiz Final (necessário para certificado)</Label>
            </div>

            {/* Questions */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Questões ({quizForm.questions.length})</h4>
                <Button variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Questão
                </Button>
              </div>

              {quizForm.questions.map((question, idx) => (
                <Card key={idx} className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge>Questão {idx + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => removeQuestion(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label>Pergunta *</Label>
                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(idx, "question_text", e.target.value)}
                        placeholder="Digite a pergunta..."
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tipo</Label>
                        <Select
                          value={question.question_type}
                          onValueChange={(value) => updateQuestion(idx, "question_type", value)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Múltipla Escolha</SelectItem>
                            <SelectItem value="true_false">Verdadeiro/Falso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pontos</Label>
                        <Input
                          type="number"
                          value={question.points}
                          onChange={(e) => updateQuestion(idx, "points", parseInt(e.target.value) || 10)}
                        />
                      </div>
                    </div>

                    {question.question_type === "multiple_choice" && (
                      <div className="space-y-2">
                        <Label>Opções</Label>
                        {question.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="w-6 text-center font-medium text-muted-foreground">
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <Input
                              value={opt}
                              onChange={(e) => updateQuestionOption(idx, optIdx, e.target.value)}
                              placeholder={`Opção ${String.fromCharCode(65 + optIdx)}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label>Resposta Correta</Label>
                      {question.question_type === "true_false" ? (
                        <Select
                          value={question.correct_answer}
                          onValueChange={(value) => updateQuestion(idx, "correct_answer", value)}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Verdadeiro</SelectItem>
                            <SelectItem value="false">Falso</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Select
                          value={question.correct_answer}
                          onValueChange={(value) => updateQuestion(idx, "correct_answer", value)}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione a resposta correta" /></SelectTrigger>
                          <SelectContent>
                            {question.options.filter(o => o).map((opt, optIdx) => (
                              <SelectItem key={optIdx} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Explicação (opcional)</Label>
                      <Textarea
                        value={question.explanation}
                        onChange={(e) => updateQuestion(idx, "explanation", e.target.value)}
                        placeholder="Explicação da resposta correta..."
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={resetQuizForm}>Cancelar</Button>
            <Button 
              onClick={() => createQuizMutation.mutate(quizForm)} 
              disabled={!quizForm.title || quizForm.questions.length === 0}
            >
              Criar Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
