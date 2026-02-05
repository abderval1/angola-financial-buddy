import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Building2, 
  FileText, 
  HelpCircle,
  Lock,
  CheckCircle
} from "lucide-react";

export function InvestmentTrustBadges() {
  return (
    <Card className="border-border/50 bg-muted/30">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-success" />
            <span>Regulado pelo BNA</span>
          </div>
          
          <div className="h-4 w-px bg-border hidden sm:block" />
          
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span>Parceria CMC</span>
          </div>
          
          <div className="h-4 w-px bg-border hidden sm:block" />
          
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-accent" />
            <span>Dados Seguros</span>
          </div>
          
          <div className="h-4 w-px bg-border hidden sm:block" />
          
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>Custos Transparentes</span>
          </div>
          
          <div className="h-4 w-px bg-border hidden sm:block" />
          
          <div className="flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-muted-foreground" />
            <span>FAQ Disponível</span>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-border/50">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-xs text-muted-foreground">
            Todas as operações são auditadas e seguem as normas do mercado angolano
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
