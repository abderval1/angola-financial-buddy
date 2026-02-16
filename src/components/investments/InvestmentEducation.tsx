import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Play,
  Clock,
  ChevronRight,
  BookOpen,
  Lightbulb,
  TrendingUp,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface EducationTopic {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: React.ReactNode;
  type: "video" | "article";
}

const QUICK_LESSONS: EducationTopic[] = [
  {
    id: "otnr-explained",
    title: "O que é OTNR?",
    description: "Obrigações do Tesouro explicadas de forma simples",
    duration: "3 min",
    icon: <Shield className="h-4 w-4" />,
    type: "video",
  },
  {
    id: "bt-vs-deposito",
    title: "BT vs Depósito a Prazo",
    description: "Qual é melhor para o seu perfil?",
    duration: "4 min",
    icon: <Lightbulb className="h-4 w-4" />,
    type: "article",
  },
  {
    id: "what-is-risk",
    title: "O que é risco?",
    description: "Entenda os diferentes níveis de risco",
    duration: "2 min",
    icon: <TrendingUp className="h-4 w-4" />,
    type: "video",
  },
  {
    id: "compound-interest",
    title: "Juros Compostos",
    description: "Como o seu dinheiro multiplica sozinho",
    duration: "5 min",
    icon: <BookOpen className="h-4 w-4" />,
    type: "article",
  },
  {
    id: "reinvest-interest",
    title: "Reinvestir Juros",
    description: "Potencialize seus ganhos automaticamente",
    duration: "3 min",
    icon: <TrendingUp className="h-4 w-4" />,
    type: "video",
  },
];

export function InvestmentEducation() {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("Aprenda em 3 minutos")}</CardTitle>
              <p className="text-sm text-muted-foreground">{t("Educação financeira simplificada")}</p>
            </div>
          </div>
          <Link to="/education">
            <Button variant="ghost" size="sm">
              {t("Ver Todos")}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {QUICK_LESSONS.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/education?topic=${lesson.id}`}
              className="block"
            >
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group cursor-pointer">
                <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                  {lesson.type === "video" ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    lesson.icon
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
                    {t(lesson.title)}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {t(lesson.description)}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="secondary" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {lesson.duration}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
