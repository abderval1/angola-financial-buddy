import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  BookOpen,
  Clock,
  Award,
  Lock,
  X,
  HelpCircle,
  RotateCcw,
} from "lucide-react";

interface CourseViewerProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

interface QuizQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  points: number;
  order_index: number;
}

export function CourseViewer({ courseId, isOpen, onClose }: CourseViewerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [certificateNumber, setCertificateNumber] = useState<string | null>(null);

  // Fetch course details
  const { data: course } = useQuery({
    queryKey: ["course-detail", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("educational_content")
        .select("*")
        .eq("id", courseId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!courseId,
  });

  // Fetch course modules
  const { data: modules = [] } = useQuery({
    queryKey: ["course-modules", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!courseId,
  });

  // Fetch user's module progress
  const { data: moduleProgress = [] } = useQuery({
    queryKey: ["user-module-progress", courseId],
    queryFn: async () => {
      const moduleIds = modules.map(m => m.id);
      if (moduleIds.length === 0) return [];

      const { data, error } = await supabase
        .from("user_module_progress")
        .select("*")
        .eq("user_id", user?.id)
        .in("module_id", moduleIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!user?.id && modules.length > 0,
  });

  // Fetch final quiz
  const { data: finalQuiz } = useQuery({
    queryKey: ["course-final-quiz", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("course_quizzes")
        .select("*, quiz_questions(*)")
        .eq("course_id", courseId)
        .eq("is_final_quiz", true)
        .eq("is_active", true)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!courseId,
  });

  // Fetch user's quiz attempts
  const { data: quizAttempts = [] } = useQuery({
    queryKey: ["user-quiz-attempts", courseId],
    queryFn: async () => {
      if (!finalQuiz) return [];
      
      const { data, error } = await supabase
        .from("user_quiz_attempts")
        .select("*")
        .eq("user_id", user?.id)
        .eq("quiz_id", finalQuiz.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen && !!user?.id && !!finalQuiz,
  });

  // Fetch user certificate
  const { data: existingCertificate } = useQuery({
    queryKey: ["user-certificate", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_certificates")
        .select("*")
        .eq("user_id", user?.id)
        .eq("course_id", courseId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: isOpen && !!user?.id && !!courseId,
  });

  // Complete module mutation
  const completeModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      const { error } = await supabase
        .from("user_module_progress")
        .upsert({
          user_id: user?.id,
          module_id: moduleId,
          is_completed: true,
          completed_at: new Date().toISOString(),
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-module-progress", courseId] });
      toast.success("Módulo concluído! Próximo módulo desbloqueado.");
    },
  });

  // Submit quiz mutation
  const submitQuizMutation = useMutation({
    mutationFn: async () => {
      if (!finalQuiz) throw new Error("No quiz found");

      const questions = (finalQuiz.quiz_questions || []) as QuizQuestion[];
      let correctCount = 0;
      let totalPoints = 0;
      let earnedPoints = 0;

      const answersArray = questions.map((q: QuizQuestion) => {
        const userAnswer = quizAnswers[q.id] || "";
        const isCorrect = userAnswer === q.correct_answer;
        if (isCorrect) {
          correctCount++;
          earnedPoints += q.points;
        }
        totalPoints += q.points;
        return {
          question_id: q.id,
          user_answer: userAnswer,
          correct_answer: q.correct_answer,
          is_correct: isCorrect,
        };
      });

      const scorePercent = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
      const passed = scorePercent >= (finalQuiz.passing_score || 70);

      const { error } = await supabase
        .from("user_quiz_attempts")
        .insert({
          user_id: user?.id,
          quiz_id: finalQuiz.id,
          score: scorePercent,
          total_points: totalPoints,
          passed,
          answers: answersArray,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      return { scorePercent, passed, earnedPoints };
    },
    onSuccess: (result) => {
      setQuizSubmitted(true);
      setQuizScore(result.scorePercent);
      queryClient.invalidateQueries({ queryKey: ["user-quiz-attempts", courseId] });
      
      if (result.passed) {
        toast.success(`Parabéns! Você passou com ${result.scorePercent}%!`);
      } else {
        toast.error(`Você obteve ${result.scorePercent}%. Nota mínima: ${finalQuiz?.passing_score || 70}%`);
      }
    },
    onError: () => toast.error("Erro ao submeter quiz"),
  });

  // Generate certificate mutation
  const generateCertificateMutation = useMutation({
    mutationFn: async () => {
      const certNumber = `KUANZA-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      const { error: certError } = await supabase
        .from("user_certificates")
        .insert({
          user_id: user?.id,
          course_id: courseId,
          certificate_number: certNumber,
          user_name: user?.user_metadata?.name || user?.email?.split("@")[0] || "Estudante",
          course_title: course?.title,
          completion_date: new Date().toISOString(),
        });
      
      if (certError) throw certError;

      // Update course progress
      await supabase
        .from("user_content_progress")
        .upsert({
          user_id: user?.id,
          content_id: courseId,
          is_completed: true,
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
        });

      // Update gamification
      const { data: gamification } = await supabase
        .from("user_gamification")
        .select("*")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (gamification) {
        const pointsToAdd = course?.points_reward || 50;
        await supabase
          .from("user_gamification")
          .update({
            total_points: (gamification.total_points || 0) + pointsToAdd,
            lessons_completed: (gamification.lessons_completed || 0) + 1,
            last_activity_at: new Date().toISOString(),
          })
          .eq("user_id", user?.id);
      }

      return certNumber;
    },
    onSuccess: (certNumber) => {
      setCertificateNumber(certNumber);
      setShowCertificate(true);
      queryClient.invalidateQueries({ queryKey: ["user-certificate", courseId] });
      queryClient.invalidateQueries({ queryKey: ["user-content-progress"] });
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
      toast.success(`Parabéns! Certificado gerado: ${certNumber}`);
    },
    onError: () => toast.error("Erro ao gerar certificado"),
  });

  const currentModule = modules[currentModuleIndex];
  const isModuleCompleted = (moduleId: string) => 
    moduleProgress.some(p => p.module_id === moduleId && p.is_completed);
  
  const completedModulesCount = moduleProgress.filter(p => p.is_completed).length;
  const progressPercentage = modules.length > 0 
    ? Math.round((completedModulesCount / modules.length) * 100) 
    : 0;

  const allModulesCompleted = modules.length > 0 && completedModulesCount === modules.length;
  const isLastModule = currentModuleIndex === modules.length - 1;
  const hasFinalQuiz = !!finalQuiz && (finalQuiz.quiz_questions?.length || 0) > 0;
  const hasPassedQuiz = quizAttempts.some(a => a.passed);
  const hasCertificate = !!existingCertificate;

  // Check if current module is unlocked
  const isModuleUnlocked = (index: number) => {
    if (index === 0) return true;
    return isModuleCompleted(modules[index - 1]?.id);
  };

  // Reset state on course change
  useEffect(() => {
    setCurrentModuleIndex(0);
    setShowCertificate(false);
    setShowQuiz(false);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  }, [courseId]);

  // Show certificate if already exists
  useEffect(() => {
    if (existingCertificate) {
      setCertificateNumber(existingCertificate.certificate_number);
    }
  }, [existingCertificate]);

  const handleFinishModule = () => {
    if (!isModuleCompleted(currentModule.id)) {
      completeModuleMutation.mutate(currentModule.id);
    }
  };

  const handleGoToNextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(prev => prev + 1);
    }
  };

  const handleStartQuiz = () => {
    setShowQuiz(true);
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const handleRetryQuiz = () => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setQuizScore(0);
  };

  const renderYouTubeEmbed = (url: string) => {
    let videoId = "";
    
    if (url.includes("youtube.com/watch?v=")) {
      videoId = url.split("v=")[1]?.split("&")[0] || "";
    } else if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split("?")[0] || "";
    } else if (url.includes("youtube.com/embed/")) {
      videoId = url.split("embed/")[1]?.split("?")[0] || "";
    }

    if (!videoId) {
      return (
        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
          <p className="text-muted-foreground">URL do vídeo inválida</p>
        </div>
      );
    }

    return (
      <div className="aspect-video rounded-lg overflow-hidden">
        <iframe
          width="100%"
          height="100%"
          src={`https://www.youtube.com/embed/${videoId}`}
          title="YouTube video player"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[95vh] p-0 gap-0 flex flex-col overflow-hidden">
        {showCertificate ? (
          // Certificate View
          <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-full p-8 bg-gradient-to-br from-primary/5 to-accent/5">
              <div className="w-full max-w-2xl p-8 border-4 border-primary rounded-xl bg-card shadow-2xl">
                <div className="text-center space-y-6">
                  <Award className="h-20 w-20 text-primary mx-auto" />
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wider">Certificado de Conclusão</p>
                    <h1 className="text-3xl font-bold mt-2">Parabéns!</h1>
                  </div>
                  
                  <div className="py-6 border-y">
                    <p className="text-muted-foreground">Este certificado atesta que</p>
                    <p className="text-2xl font-bold text-primary mt-2">
                      {user?.user_metadata?.name || user?.email?.split("@")[0]}
                    </p>
                    <p className="text-muted-foreground mt-4">concluiu com sucesso o curso</p>
                    <p className="text-xl font-semibold mt-2">{course?.title}</p>
                  </div>

                  <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{course?.duration_minutes || 60} minutos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{modules.length} módulos</span>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-xs text-muted-foreground">Certificado Nº</p>
                    <p className="font-mono text-sm font-semibold">{certificateNumber || existingCertificate?.certificate_number}</p>
                  </div>

                  <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2">
                    +{course?.points_reward || 50} Pontos Kuanza
                  </Badge>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <Button variant="outline" onClick={() => setShowCertificate(false)}>
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Voltar ao Curso
                </Button>
                <Button onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        ) : showQuiz ? (
          // Quiz View
          <div className="flex flex-col h-full">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30 shrink-0">
              <div>
                <h2 className="font-semibold text-lg">{finalQuiz?.title || "Quiz Final"}</h2>
                <p className="text-sm text-muted-foreground">
                  Nota mínima: {finalQuiz?.passing_score || 70}%
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowQuiz(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-2xl mx-auto space-y-6">
                {quizSubmitted ? (
                  // Quiz Results
                  <Card className="p-6">
                    <div className="text-center space-y-4">
                      <div className={`h-20 w-20 mx-auto rounded-full flex items-center justify-center ${
                        quizScore >= (finalQuiz?.passing_score || 70) 
                          ? "bg-success/20" 
                          : "bg-destructive/20"
                      }`}>
                        {quizScore >= (finalQuiz?.passing_score || 70) ? (
                          <CheckCircle className="h-10 w-10 text-success" />
                        ) : (
                          <X className="h-10 w-10 text-destructive" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold">
                          {quizScore >= (finalQuiz?.passing_score || 70) ? "Aprovado!" : "Não Aprovado"}
                        </h3>
                        <p className="text-4xl font-bold text-primary mt-2">{quizScore}%</p>
                        <p className="text-muted-foreground mt-2">
                          Nota mínima: {finalQuiz?.passing_score || 70}%
                        </p>
                      </div>

                      <div className="flex justify-center gap-4 pt-4">
                        {quizScore >= (finalQuiz?.passing_score || 70) ? (
                          <Button onClick={() => {
                            if (!hasCertificate) {
                              generateCertificateMutation.mutate();
                            } else {
                              setShowCertificate(true);
                            }
                          }}>
                            <Award className="h-4 w-4 mr-2" />
                            {hasCertificate ? "Ver Certificado" : "Obter Certificado"}
                          </Button>
                        ) : (
                          <Button onClick={handleRetryQuiz}>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Tentar Novamente
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ) : (
                  // Quiz Questions
                  <>
                    {(finalQuiz?.quiz_questions as QuizQuestion[] || [])
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((question: QuizQuestion, idx: number) => (
                        <Card key={question.id} className="p-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              <Badge className="shrink-0">{idx + 1}</Badge>
                              <p className="font-medium">{question.question_text}</p>
                            </div>

                            <RadioGroup
                              value={quizAnswers[question.id] || ""}
                              onValueChange={(value) => setQuizAnswers(prev => ({
                                ...prev,
                                [question.id]: value
                              }))}
                            >
                              {question.question_type === "true_false" ? (
                                <div className="space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="true" id={`${question.id}-true`} />
                                    <Label htmlFor={`${question.id}-true`}>Verdadeiro</Label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="false" id={`${question.id}-false`} />
                                    <Label htmlFor={`${question.id}-false`}>Falso</Label>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {(question.options || []).map((option: string, optIdx: number) => (
                                    <div key={optIdx} className="flex items-center space-x-2">
                                      <RadioGroupItem value={option} id={`${question.id}-${optIdx}`} />
                                      <Label htmlFor={`${question.id}-${optIdx}`}>
                                        {String.fromCharCode(65 + optIdx)}. {option}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </RadioGroup>
                          </div>
                        </Card>
                    ))}

                    <div className="flex justify-center pt-4 pb-8">
                      <Button 
                        size="lg"
                        onClick={() => submitQuizMutation.mutate()}
                        disabled={submitQuizMutation.isPending || Object.keys(quizAnswers).length === 0}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Submeter Respostas
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Course Content View
          <div className="flex h-full">
            {/* Sidebar - Module List */}
            <div className="w-80 border-r bg-muted/30 flex flex-col shrink-0">
              <div className="p-4 border-b shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold truncate pr-2">{course?.title}</h3>
                  <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progresso</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {completedModulesCount} de {modules.length} módulos concluídos
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {modules.map((mod, index) => {
                    const completed = isModuleCompleted(mod.id);
                    const isCurrent = index === currentModuleIndex;
                    const isLocked = !isModuleUnlocked(index);

                    return (
                      <button
                        key={mod.id}
                        onClick={() => !isLocked && setCurrentModuleIndex(index)}
                        disabled={isLocked}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          isCurrent 
                            ? "bg-primary text-primary-foreground" 
                            : completed
                              ? "bg-success/10 hover:bg-success/20"
                              : isLocked
                                ? "bg-muted opacity-50 cursor-not-allowed"
                                : "hover:bg-muted"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {completed ? (
                              <CheckCircle className={`h-5 w-5 ${isCurrent ? "text-primary-foreground" : "text-success"}`} />
                            ) : isLocked ? (
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            ) : (
                              <Circle className={`h-5 w-5 ${isCurrent ? "text-primary-foreground" : "text-muted-foreground"}`} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium text-sm ${isCurrent ? "text-primary-foreground" : ""}`}>
                              {index + 1}. {mod.title}
                            </p>
                            <div className={`flex items-center gap-2 text-xs mt-1 ${
                              isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}>
                              {mod.duration_minutes && <span>{mod.duration_minutes} min</span>}
                              {mod.is_free && <Badge variant="outline" className="text-[10px] h-4">Grátis</Badge>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}

                  {/* Quiz Section */}
                  {hasFinalQuiz && (
                    <div className="pt-4 border-t mt-4">
                      <button
                        onClick={handleStartQuiz}
                        disabled={!allModulesCompleted}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          hasPassedQuiz
                            ? "bg-success/10"
                            : allModulesCompleted
                              ? "bg-primary/10 hover:bg-primary/20"
                              : "bg-muted opacity-50 cursor-not-allowed"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                            hasPassedQuiz ? "bg-success/20" : "bg-primary/20"
                          }`}>
                            {hasPassedQuiz ? (
                              <CheckCircle className="h-4 w-4 text-success" />
                            ) : (
                              <HelpCircle className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">Quiz Final</p>
                            <p className="text-xs text-muted-foreground">
                              {hasPassedQuiz ? "Aprovado ✓" : allModulesCompleted ? `Mínimo ${finalQuiz.passing_score}%` : "Complete todos os módulos"}
                            </p>
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Certificate Section */}
                  {(hasCertificate || hasPassedQuiz) && (
                    <button
                      onClick={() => {
                        if (hasCertificate) {
                          setShowCertificate(true);
                        } else if (hasPassedQuiz) {
                          generateCertificateMutation.mutate();
                        }
                      }}
                      className="w-full text-left p-3 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Award className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Certificado</p>
                          <p className="text-xs text-muted-foreground">
                            {hasCertificate ? "Ver certificado" : "Obter certificado"}
                          </p>
                        </div>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
              {currentModule ? (
                <>
                  <div className="p-6 border-b shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Módulo {currentModuleIndex + 1}</Badge>
                      {currentModule.is_free && (
                        <Badge className="bg-success/10 text-success">Gratuito</Badge>
                      )}
                      {isModuleCompleted(currentModule.id) && (
                        <Badge className="bg-success text-success-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Concluído
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold">{currentModule.title}</h2>
                    {currentModule.description && (
                      <p className="text-muted-foreground mt-2">{currentModule.description}</p>
                    )}
                  </div>

                  {/* SCROLLABLE CONTENT AREA */}
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="max-w-4xl mx-auto space-y-6 pb-8">
                      {/* Video/YouTube Content */}
                      {currentModule.video_url && (
                        <div className="mb-6">
                          {currentModule.video_url.includes("youtube.com") || currentModule.video_url.includes("youtu.be") ? (
                            renderYouTubeEmbed(currentModule.video_url)
                          ) : (
                            <video 
                              controls 
                              className="w-full rounded-lg"
                              src={currentModule.video_url}
                            >
                              Seu navegador não suporta vídeos.
                            </video>
                          )}
                        </div>
                      )}

                      {/* Text Content */}
                      {currentModule.content && (
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div 
                            dangerouslySetInnerHTML={{ 
                              __html: currentModule.content.replace(/\n/g, '<br />') 
                            }} 
                          />
                        </div>
                      )}

                      {/* Empty State */}
                      {!currentModule.content && !currentModule.video_url && (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">
                            Conteúdo do módulo será adicionado em breve.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Navigation - FIXED AT BOTTOM */}
                  <div className="p-4 border-t bg-muted/30 shrink-0">
                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentModuleIndex(prev => prev - 1)}
                        disabled={currentModuleIndex === 0}
                      >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Anterior
                      </Button>

                      <div className="flex gap-2">
                        {/* FINISH MODULE BUTTON - Only shows if module not completed */}
                        {!isModuleCompleted(currentModule.id) && (
                          <Button
                            onClick={handleFinishModule}
                            disabled={completeModuleMutation.isPending}
                            className="bg-success hover:bg-success/90"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {completeModuleMutation.isPending ? "Finalizando..." : "Finalizar Módulo"}
                          </Button>
                        )}

                        {/* NEXT MODULE BUTTON - Only shows after completing current */}
                        {isModuleCompleted(currentModule.id) && !isLastModule && (
                          <Button onClick={handleGoToNextModule}>
                            Próximo Módulo
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        )}

                        {/* QUIZ BUTTON - After last module completed */}
                        {isLastModule && isModuleCompleted(currentModule.id) && hasFinalQuiz && !hasPassedQuiz && (
                          <Button className="bg-primary" onClick={handleStartQuiz}>
                            <HelpCircle className="h-4 w-4 mr-2" />
                            Fazer Quiz Final
                          </Button>
                        )}

                        {/* CERTIFICATE BUTTON - If no quiz required or already passed */}
                        {isLastModule && isModuleCompleted(currentModule.id) && !hasFinalQuiz && !hasCertificate && (
                          <Button 
                            className="bg-primary"
                            onClick={() => generateCertificateMutation.mutate()}
                            disabled={generateCertificateMutation.isPending}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Obter Certificado
                          </Button>
                        )}

                        {/* VIEW CERTIFICATE */}
                        {hasCertificate && (
                          <Button variant="outline" onClick={() => setShowCertificate(true)}>
                            <Award className="h-4 w-4 mr-2" />
                            Ver Certificado
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Selecione um módulo para começar</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
