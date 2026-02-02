import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Circle,
  Play,
  BookOpen,
  Clock,
  Award,
  Lock,
  X,
  FileText,
  Video,
  Download,
} from "lucide-react";

interface CourseViewerProps {
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CourseViewer({ courseId, isOpen, onClose }: CourseViewerProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [showCertificate, setShowCertificate] = useState(false);

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

  // Fetch overall course progress
  const { data: courseProgress } = useQuery({
    queryKey: ["user-content-progress", courseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_content_progress")
        .select("*")
        .eq("user_id", user?.id)
        .eq("content_id", courseId)
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
      toast.success("Módulo concluído!");
      
      // Auto advance to next module
      if (currentModuleIndex < modules.length - 1) {
        setTimeout(() => {
          setCurrentModuleIndex(prev => prev + 1);
        }, 500);
      }
    },
  });

  // Complete course mutation
  const completeCourseMutation = useMutation({
    mutationFn: async () => {
      // Update course progress
      const { error: progressError } = await supabase
        .from("user_content_progress")
        .upsert({
          user_id: user?.id,
          content_id: courseId,
          is_completed: true,
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
        });
      
      if (progressError) throw progressError;

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-content-progress"] });
      queryClient.invalidateQueries({ queryKey: ["user-gamification"] });
      setShowCertificate(true);
      toast.success(`Parabéns! Você completou o curso e ganhou ${course?.points_reward || 50} pontos!`);
    },
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
  const isCourseCompleted = courseProgress?.is_completed;

  // Reset module index when course changes
  useEffect(() => {
    setCurrentModuleIndex(0);
    setShowCertificate(false);
  }, [courseId]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0">
        {showCertificate ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-full max-w-lg p-8 border-4 border-primary rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <Award className="h-20 w-20 text-primary mx-auto mb-6" />
              <h2 className="text-3xl font-bold mb-2">Certificado de Conclusão</h2>
              <p className="text-muted-foreground mb-6">Este certificado confirma que</p>
              <p className="text-2xl font-semibold text-primary mb-2">
                {user?.user_metadata?.name || user?.email?.split("@")[0]}
              </p>
              <p className="text-muted-foreground mb-6">concluiu com sucesso o curso</p>
              <p className="text-xl font-semibold mb-6">{course?.title}</p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Clock className="h-4 w-4" />
                <span>{course?.duration_minutes || 60} minutos de conteúdo</span>
              </div>
              <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2">
                +{course?.points_reward || 50} Pontos
              </Badge>
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
        ) : (
          <div className="flex h-full">
            {/* Sidebar - Module List */}
            <div className="w-80 border-r bg-muted/30 flex flex-col">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold truncate">{course?.title}</h3>
                  <Button variant="ghost" size="icon" onClick={onClose}>
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

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-2">
                  {modules.map((module, index) => {
                    const completed = isModuleCompleted(module.id);
                    const isCurrent = index === currentModuleIndex;
                    const isLocked = index > 0 && !isModuleCompleted(modules[index - 1].id) && !completed;

                    return (
                      <button
                        key={module.id}
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
                            <p className={`font-medium text-sm truncate ${isCurrent ? "text-primary-foreground" : ""}`}>
                              {index + 1}. {module.title}
                            </p>
                            {module.duration_minutes && (
                              <p className={`text-xs mt-1 ${isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {module.duration_minutes} min
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
              {currentModule ? (
                <>
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">Módulo {currentModuleIndex + 1}</Badge>
                      {currentModule.is_free && (
                        <Badge className="bg-success/10 text-success">Gratuito</Badge>
                      )}
                    </div>
                    <h2 className="text-2xl font-bold">{currentModule.title}</h2>
                    {currentModule.description && (
                      <p className="text-muted-foreground mt-2">{currentModule.description}</p>
                    )}
                  </div>

                  <ScrollArea className="flex-1 p-6">
                    {/* Video Content */}
                    {currentModule.video_url && (
                      <div className="mb-6">
                        <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                          <div className="text-center">
                            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                            <p className="text-muted-foreground">
                              Conteúdo de vídeo: {currentModule.video_url}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Text Content */}
                    {currentModule.content && (
                      <div className="prose prose-sm max-w-none">
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
                  </ScrollArea>

                  {/* Footer Navigation */}
                  <div className="p-4 border-t bg-muted/30">
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
                        {!isModuleCompleted(currentModule.id) && (
                          <Button
                            variant="outline"
                            onClick={() => completeModuleMutation.mutate(currentModule.id)}
                            disabled={completeModuleMutation.isPending}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Marcar como Concluído
                          </Button>
                        )}

                        {isLastModule && allModulesCompleted && !isCourseCompleted ? (
                          <Button
                            className="gradient-primary"
                            onClick={() => completeCourseMutation.mutate()}
                            disabled={completeCourseMutation.isPending}
                          >
                            <Award className="h-4 w-4 mr-2" />
                            Finalizar Curso
                          </Button>
                        ) : !isLastModule ? (
                          <Button
                            onClick={() => setCurrentModuleIndex(prev => prev + 1)}
                            disabled={!isModuleCompleted(currentModule.id) && currentModuleIndex > 0}
                          >
                            Próximo
                            <ChevronRight className="h-4 w-4 ml-2" />
                          </Button>
                        ) : isCourseCompleted ? (
                          <Button onClick={() => setShowCertificate(true)}>
                            <Award className="h-4 w-4 mr-2" />
                            Ver Certificado
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">Nenhum módulo disponível</h3>
                    <p className="text-muted-foreground">
                      Os módulos deste curso serão adicionados em breve.
                    </p>
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
