import { Plus, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  onMealOpen: () => void;
  onWorkoutOpen: () => void;
};

export function ActionButtons({ onMealOpen, onWorkoutOpen }: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 sm:bottom-6 sm:left-auto sm:right-6 sm:w-auto">
      {/* SP: 画面下部固定バー */}
      <div className="sm:hidden border-t bg-card px-4 pt-3 pb-4 grid grid-cols-2 gap-2">
        <Button variant="outline" className="w-full h-auto pt-2 pb-2.5" onClick={onMealOpen}>
          <Utensils className="h-4 w-4 mr-1" />
          食事を追加
        </Button>
        <Button className="w-full h-auto pt-2 pb-2.5 hover:bg-primary/80" onClick={onWorkoutOpen}>
          <Plus className="h-4 w-4 mr-1" />
          筋トレを追加
        </Button>
      </div>
      {/* PC: 右下FAB */}
      <div className="hidden sm:flex flex-col items-stretch gap-2">
        <Button
          size="lg"
          variant="outline"
          className="flex items-center gap-1 shadow-lg rounded-lg h-auto px-6 pt-1.5 pb-2 hover:shadow-xl hover:scale-105"
          onClick={onMealOpen}
        >
          <Utensils className="h-5 w-5" />
          食事を追加
        </Button>
        <Button
          size="lg"
          className="flex items-center gap-1 shadow-lg rounded-lg h-auto px-6 pt-1.5 pb-2 hover:bg-primary/80 hover:shadow-xl hover:scale-105"
          onClick={onWorkoutOpen}
        >
          <Plus className="h-5 w-5" />
          筋トレを追加
        </Button>
      </div>
    </div>
  );
}
