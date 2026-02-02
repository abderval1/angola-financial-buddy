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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
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
  ChevronRight,
  Eye,
  Layers,
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

interface Quiz {
  id: string;
  title: string;
  description: string;
  passing_score: number;
  is_final_quiz: boolean;
  questions: Question[];
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
  const [moduleDialogOpen, setModuleDialogOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "thumbnail_url" | "video_url") => {
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

      setModuleForm(prev => ({ ...prev, [field]: urlData.publicUrl }));
      toast.success("Arquivo enviado!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao enviar arquivo");
    } finally {
      setUploading(false);
    }
  };

  // Module mutations
  const createModuleMutation = useMutation({
    mutationFn: async (data: Partial<Module>) => {
      const insertData = {
        title: data.title || "",
        description: data.description || null,
        content: data.content || null,
        video_url: data.video_url || null,
        duration_minutes: data.duration_minutes || 0,
        is_free: data.is_free || false,
        course_id: selectedCourseId!,
        order_index: modules.length,
      };
      const { error } = await supabase.from("course_modules").insert(insertData);
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
      const updateData = {
        title: data.title || "",
        description: data.description || null,
        content: data.content || null,
        video_url: data.video_url || null,
        duration_minutes: data.duration_minutes || 0,
        is_free: data.is_free || false,
      };
      const { error } = await supabase.from("course_modules").update(updateData).eq("id", id);
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
    setEditingQuiz(null);
    setQuizForm({
      title: "",
      description: "",
      passing_score: 70,
      is_final_quiz: false,
      questions: [],
    });
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

  const handleModuleSubmit = () => {
    if (editingModule) {
      updateModuleMutation.mutate({ id: editingModule.id, data: moduleForm as Module });
    } else {
      createModuleMutation.mutate(moduleForm);
    }
  };

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
          <p className="text-muted-foreground">Gerencie cursos, módulos e quizzes</p>
        </div>
      </div>

      {/* Course Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Selecionar Curso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedCourseId || ""} onValueChange={setSelectedCourseId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um curso para gerenciar" />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course: any) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedCourse && (
        <Tabs defaultValue="modules" className="space-y-4">
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

          {/* Modules Tab */}
          <TabsContent value="modules" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Módulos do Curso</h3>
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
                              <Badge variant="outline" className="text-xs">
                                {mod.media_type === "youtube" ? "YouTube" : 
                                 mod.media_type === "video" ? "Vídeo" : 
                                 mod.media_type === "image" ? "Imagem" : "Texto"}
                              </Badge>
                              {mod.duration_minutes && (
                                <span>{mod.duration_minutes} min</span>
                              )}
                              {mod.is_free && (
                                <Badge className="bg-success/10 text-success text-xs">Gratuito</Badge>
                              )}
                              {mod.has_quiz && (
                                <Badge className="bg-primary/10 text-primary text-xs">Quiz</Badge>
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

            {/* Module Dialog */}
            <Dialog open={moduleDialogOpen} onOpenChange={setModuleDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingModule ? "Editar Módulo" : "Novo Módulo"}
                  </DialogTitle>
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
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Texto
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
                            YouTube (Iframe)
                          </div>
                        </SelectItem>
                        <SelectItem value="image">
                          <div className="flex items-center gap-2">
                            <Image className="h-4 w-4" />
                            Imagem
                          </div>
                        </SelectItem>
                        <SelectItem value="mixed">
                          <div className="flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Misto (Texto + Mídia)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(moduleForm.media_type === "youtube" || moduleForm.media_type === "video") && (
                    <div className="space-y-2">
                      <Label>
                        {moduleForm.media_type === "youtube" ? "URL do YouTube" : "URL do Vídeo"}
                      </Label>
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
                            onChange={(e) => handleFileUpload(e, "video_url")}
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

                  {(moduleForm.media_type === "image" || moduleForm.media_type === "mixed") && (
                    <div className="space-y-2">
                      <Label>Imagem / Thumbnail</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={moduleForm.thumbnail_url}
                          onChange={(e) => setModuleForm({ ...moduleForm, thumbnail_url: e.target.value })}
                          placeholder="URL da imagem"
                          className="flex-1"
                        />
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          id="thumb-upload"
                          onChange={(e) => handleFileUpload(e, "thumbnail_url")}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => document.getElementById("thumb-upload")?.click()}
                          disabled={uploading}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      </div>
                      {moduleForm.thumbnail_url && (
                        <img 
                          src={moduleForm.thumbnail_url} 
                          alt="Preview" 
                          className="h-24 object-cover rounded-lg mt-2"
                        />
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Conteúdo do Módulo</Label>
                    <Textarea
                      value={moduleForm.content}
                      onChange={(e) => setModuleForm({ ...moduleForm, content: e.target.value })}
                      placeholder="Conteúdo em texto/HTML do módulo..."
                      rows={8}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Suporta HTML básico para formatação
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={moduleForm.is_free}
                        onCheckedChange={(checked) => setModuleForm({ ...moduleForm, is_free: checked })}
                      />
                      <Label>Módulo Gratuito</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={moduleForm.has_quiz}
                        onCheckedChange={(checked) => setModuleForm({ ...moduleForm, has_quiz: checked })}
                      />
                      <Label>Tem Quiz</Label>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={resetModuleForm}>
                    Cancelar
                  </Button>
                  <Button onClick={handleModuleSubmit} disabled={!moduleForm.title}>
                    {editingModule ? "Atualizar" : "Criar Módulo"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Quizzes Tab */}
          <TabsContent value="quizzes" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Quizzes do Curso</h3>
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive"
                            onClick={() => deleteQuizMutation.mutate(quiz.id)}
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

            {/* Quiz Dialog */}
            <Dialog open={quizDialogOpen} onOpenChange={setQuizDialogOpen}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                  <DialogTitle>Novo Quiz</DialogTitle>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-6 py-4">
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
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
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
                                      onChange={(e) => {
                                        const newOptions = [...question.options];
                                        newOptions[optIdx] = e.target.value;
                                        updateQuestion(idx, "options", newOptions);
                                      }}
                                      placeholder={`Opção ${String.fromCharCode(65 + optIdx)}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="space-y-2">
                              <Label>Resposta Correta *</Label>
                              {question.question_type === "true_false" ? (
                                <Select
                                  value={question.correct_answer}
                                  onValueChange={(value) => updateQuestion(idx, "correct_answer", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione" />
                                  </SelectTrigger>
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
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a resposta correta" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {question.options.map((opt, optIdx) => (
                                      <SelectItem key={optIdx} value={opt || `option_${optIdx}`}>
                                        {String.fromCharCode(65 + optIdx)}: {opt || "(vazio)"}
                                      </SelectItem>
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
                                placeholder="Explicação que aparece após responder..."
                                rows={2}
                              />
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="border-t pt-4">
                  <Button variant="outline" onClick={resetQuizForm}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={() => createQuizMutation.mutate(quizForm)} 
                    disabled={!quizForm.title || quizForm.questions.length === 0}
                  >
                    Criar Quiz
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
