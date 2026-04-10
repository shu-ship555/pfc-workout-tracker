"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutForm } from "@/components/workout-form";
import type { WorkoutEntry } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
  workouts: WorkoutEntry[];
  loading: boolean;
  onUpdate: (entry: WorkoutEntry) => void;
  onDelete: (id: string) => void;
};

export function WorkoutList({ workouts, loading, onUpdate, onDelete }: Props) {
  const [editTarget, setEditTarget] = useState<WorkoutEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await fetch(`/api/workouts/${deleteTarget.id}`, { method: "DELETE" });
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
    setDeleting(false);
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <p className="text-sm">記録がありません</p>
        <p className="text-xs mt-1">「記録を追加」から最初のトレーニングを登録しましょう</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日付</TableHead>
              <TableHead>種目</TableHead>
              <TableHead className="text-right">セット</TableHead>
              <TableHead className="text-right">レップ</TableHead>
              <TableHead className="text-right">重量</TableHead>
              <TableHead className="text-right">P</TableHead>
              <TableHead className="text-right">F</TableHead>
              <TableHead className="text-right">C</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {workouts.map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">{w.date}</TableCell>
                <TableCell className="font-medium">{w.exercise}</TableCell>
                <TableCell className="text-right">{w.sets}</TableCell>
                <TableCell className="text-right">{w.reps}</TableCell>
                <TableCell className="text-right">
                  <span className="font-mono">{w.weight}</span>
                  <span className="text-xs text-muted-foreground ml-0.5">kg</span>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-mono text-blue-600 dark:text-blue-400">{w.protein}g</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-mono text-yellow-600 dark:text-yellow-400">{w.fat}g</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="font-mono text-green-600 dark:text-green-400">{w.carbs}g</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditTarget(w)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(w)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>記録を編集</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <WorkoutForm
              initial={editTarget}
              onSuccess={(entry) => {
                onUpdate(entry);
                setEditTarget(null);
              }}
              onCancel={() => setEditTarget(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記録を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.exercise}」({deleteTarget?.date}) の記録を削除します。この操作は取り消せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
