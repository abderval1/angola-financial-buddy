import { Button } from "@/components/ui/button";
import {
  Plus,
  RefreshCw,
  Wallet,
  BarChart3,
  GraduationCap
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface QuickActionsProps {
  onInvestNow: () => void;
  onWithdraw: () => void;
  onViewDetails: () => void;
}

export function InvestmentQuickActions({
  onInvestNow,
  onWithdraw,
  onViewDetails,
}: QuickActionsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        variant="accent"
        size="lg"
        className="flex-1 min-w-[140px] h-14 text-base"
        onClick={onInvestNow}
      >
        <Plus className="h-5 w-5 mr-2" />
        {t("Investir Agora")}
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="flex-1 min-w-[140px] h-14 text-base"
        onClick={onWithdraw}
      >
        <Wallet className="h-5 w-5 mr-2" />
        {t("Resgatar")}
      </Button>

      <Button
        variant="secondary"
        size="lg"
        className="flex-1 min-w-[140px] h-14 text-base"
        onClick={onViewDetails}
      >
        <BarChart3 className="h-5 w-5 mr-2" />
        {t("Ver Detalhes")}
      </Button>

      <Link to="/education" className="flex-1 min-w-[140px]">
        <Button
          variant="ghost"
          size="lg"
          className="w-full h-14 text-base border-2 border-dashed border-primary/30 hover:border-primary/50 hover:bg-primary/5"
        >
          <GraduationCap className="h-5 w-5 mr-2" />
          {t("Aprender a Investir")}
        </Button>
      </Link>
    </div>
  );
}
