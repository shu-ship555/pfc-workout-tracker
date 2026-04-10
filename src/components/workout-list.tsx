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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutForm } from "@/components/workout-form";
import type { WorkoutEntry } from "@/lib/types";
import { Pencil, Trash2 } from "lucide-react";

const DAYS_PER_PAGE = 28; // 4週間

/** page=1 → 直近28日、page=2 → その前28日、... */
function getPageWindow(page: number): { from: Date; to: Date } {
  const now = new Date();
  const to = new Date(now);
  to.setDate(to.getDate() - (page - 1) * DAYS_PER_PAGE);
  const from = new Date(now);
  from.setDate(from.getDate() - page * DAYS_PER_PAGE);
  return { from, to };
}

function calcTotalPages(workouts: WorkoutEntry[]): number {
  if (workouts.length === 0) return 1;
  const oldest = new Date(workouts[workouts.length - 1].created);
  const diffDays = Math.ceil((Date.now() - oldest.getTime()) / 86400000);
  return Math.max(1, Math.ceil(diffDays / DAYS_PER_PAGE));
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ja-JP", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatWindowLabel(page: number): string {
  const { from, to } = getPageWindow(page);
  const fmt = (d: Date) =>
    d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
  return `${fmt(from)} 〜 ${fmt(to)}`;
}

type Props = {
  workouts: WorkoutEntry[];
  loading: boolean;
  paginate?: boolean;
  onUpdate: (entry: WorkoutEntry) => void;
  onDelete: (id: string) => void;
};

export function WorkoutList({ workouts, loading, paginate = false, onUpdate, onDelete }: Props) {
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<WorkoutEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalPages = paginate ? calcTotalPages(workouts) : 1;

  const displayed = paginate
    ? (() => {
        const { from, to } = getPageWindow(page);
        return workouts.filter((w) => {
          const d = new Date(w.created);
          return d >= from && d < to;
        });
      })()
    : workouts;

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
      {paginate && (
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-muted-foreground">{formatWindowLabel(page)}</p>
          <Pagination className="w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  text="新しい期間"
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.max(1, p - 1)); }}
                  aria-disabled={page === 1}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-xs px-2 text-muted-foreground tabular-nums">
                  {page} / {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  text="古い期間"
                  href="#"
                  onClick={(e) => { e.preventDefault(); setPage((p) => Math.min(totalPages, p + 1)); }}
                  aria-disabled={page === totalPages}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border rounded-md">
          <p className="text-sm">この期間の記録はありません</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>日時</TableHead>
                <TableHead>部位</TableHead>
                <TableHead>種目</TableHead>
                <TableHead className="text-right">セット</TableHead>
                <TableHead className="text-right">レップ</TableHead>
                <TableHead className="text-right">重量</TableHead>
                <TableHead className="text-right">目標</TableHead>
                <TableHead>フラグ</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((w) => (
                <TableRow key={w.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(w.created)}
                  </TableCell>
                  <TableCell>
                    {w.parts && <Badge variant="secondary">{w.parts}</Badge>}
                  </TableCell>
                  <TableCell className="font-medium">{w.exercise}</TableCell>
                  <TableCell className="text-right">{w.set}</TableCell>
                  <TableCell className="text-right">{w.rep}</TableCell>
                  <TableCell className="text-right">
                    <span className="font-mono">{w.weight}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">kg</span>
                  </TableCell>
                  <TableCell className="text-right">
                    {w.goal > 0 && (
                      <>
                        <span className="font-mono">{w.goal}</span>
                        <span className="text-xs text-muted-foreground ml-0.5">kg</span>
                      </>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      {w.warmup && <Badge variant="outline" className="text-xs">WU</Badge>}
                      {w.negative && <Badge variant="outline" className="text-xs">NEG</Badge>}
                      {w.hasRebound && <Badge variant="outline" className="text-xs text-yellow-600">反動</Badge>}
                      {w.notStable && <Badge variant="outline" className="text-xs text-red-500">不安定</Badge>}
                    </div>
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
      )}

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

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>記録を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{deleteTarget?.exercise}」の記録を削除します。この操作は取り消せません。
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
