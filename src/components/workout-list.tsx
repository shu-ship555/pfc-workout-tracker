"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { DateRangeInput } from "@/components/date-range-input";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkoutForm } from "@/components/workout-form";
import { PartSelect, ExerciseSelect } from "@/components/workout-selects";
import type { WorkoutEntry } from "@/lib/types";
import { jstToday, jstMonthsAgo, formatDateTime } from "@/lib/date-utils";
import { FLAG_COLORS } from "@/lib/color-constants";
import { apiDelete } from "@/lib/api-client";
import { Dumbbell, Pencil, Trash2, MessageSquare, X } from "lucide-react";

const DAYS_PER_PAGE = 14; // 2週間

/** page=1 → 直近14日、page=2 → その前14日、... */
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


type Props = {
  workouts: WorkoutEntry[];
  loading: boolean;
  paginate?: boolean;
  hasFullHistory?: boolean;
  onLoadAll?: () => Promise<void>;
  onUpdate: (entry: WorkoutEntry) => void;
  onDelete: (id: string) => void;
};

export function WorkoutList({ workouts, loading, paginate = false, hasFullHistory = false, onLoadAll, onUpdate, onDelete }: Props) {
  const [page, setPage] = useState(1);
  const [editTarget, setEditTarget] = useState<WorkoutEntry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutEntry | null>(null);
  const [memoTarget, setMemoTarget] = useState<WorkoutEntry | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollDown(el.scrollHeight - el.scrollTop - el.clientHeight > 8);
  }, []);

  const todayStr = jstToday();
  const defaultFilterFrom = jstMonthsAgo(3);

  const [filterDateFrom, setFilterDateFrom] = useState(defaultFilterFrom);
  const [filterDateTo, setFilterDateTo] = useState(todayStr);
  const [filterParts, setFilterParts] = useState("");
  const [filterExercise, setFilterExercise] = useState("");

  const isFiltered = !!(filterDateFrom !== defaultFilterFrom || filterParts || filterExercise || filterDateTo !== todayStr);

  function resetFilters() {
    setFilterDateFrom(defaultFilterFrom);
    setFilterDateTo(todayStr);
    setFilterParts("");
    setFilterExercise("");
  }

  function handleFilterPartsChange(value: string | null) {
    setFilterParts(!value || value === "すべて" ? "" : value);
    setFilterExercise("");
  }

  const baseWorkouts = workouts.filter((w) => {
    const date = w.created.slice(0, 10);
    if (filterDateFrom && date < filterDateFrom) return false;
    if (filterDateTo && date > filterDateTo) return false;
    if (filterParts && w.parts !== filterParts) return false;
    if (filterExercise && w.exercise !== filterExercise) return false;
    return true;
  });

  const totalPages = paginate && !isFiltered ? calcTotalPages(baseWorkouts) : 1;

  const displayed = paginate && !isFiltered
    ? (() => {
      const { from, to } = getPageWindow(page);
      return baseWorkouts.filter((w) => {
        const d = new Date(w.created);
        return d >= from && d < to;
      });
    })()
    : baseWorkouts;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => ro.disconnect();
  }, [displayed.length, checkScroll]);


  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    await apiDelete(`/api/workouts/${deleteTarget.id}`);
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
    setDeleting(false);
  }

  const pageNav = (
    <div className="flex items-center justify-end">
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
  );

  const header = (
    <div className="flex items-center justify-between">
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <div className="flex items-center gap-2">
          <Dumbbell className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-medium">筋トレ記録</h2>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {header}
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <div className="flex flex-col items-center justify-center pt-10 pb-12 text-muted-foreground">
          <p className="text-sm">記録がありません</p>
          <p className="text-xs mt-1">「記録を追加」から最初のトレーニングを登録しましょう</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}
      {/* フィルターパネル */}
      <div className="flex flex-wrap items-end gap-2 mb-3">
        <DateRangeInput
          from={filterDateFrom}
          to={filterDateTo}
          onFromChange={setFilterDateFrom}
          onToChange={setFilterDateTo}
        />
        <PartSelect
          value={filterParts || "すべて"}
          onValueChange={handleFilterPartsChange}
          includeAll
          triggerClassName="h-8 w-24 text-xs"
          placeholder="部位"
        />
        <ExerciseSelect
          value={filterExercise || "すべて"}
          part={filterParts}
          onValueChange={(v) => setFilterExercise(!v || v === "すべて" ? "" : v)}
          includeAll
          disabled={!filterParts}
          triggerClassName="h-8 w-44 text-xs"
          placeholder="種目"
        />
        {isFiltered && (
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={resetFilters}>
            <X className="h-3.5 w-3.5 mr-1" />
            リセット
          </Button>
        )}
        {isFiltered && (
          <p className="text-xs text-muted-foreground ml-auto">{displayed.length} 件</p>
        )}
      </div>

      {filterDateFrom < defaultFilterFrom && !hasFullHistory && (
        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs text-muted-foreground">
          <span>3ヶ月以前のデータは読み込まれていません</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            disabled={loadingAll}
            onClick={async () => {
              if (!onLoadAll) return;
              setLoadingAll(true);
              await onLoadAll();
              setLoadingAll(false);
            }}
          >
            {loadingAll ? "読み込み中..." : "全期間を読み込む"}
          </Button>
        </div>
      )}

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center pt-10 pb-12 text-muted-foreground border rounded-md">
          <p className="text-sm">この期間の記録はありません</p>
        </div>
      ) : (
        <div className="relative">
        <div ref={scrollRef} onScroll={checkScroll} className="rounded-md border max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-card">
              <TableRow className="hover:bg-transparent">
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
                    {formatDateTime(w.created)}
                  </TableCell>
                  <TableCell>
                    {w.parts && <Badge variant="secondary">{w.parts}</Badge>}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-1">
                      {w.exercise}
                      {w.memo && (
                        <button
                          type="button"
                          onClick={() => setMemoTarget(w)}
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </TableCell>
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
                      {w.hasRebound && <Badge variant="outline" className={`text-xs ${FLAG_COLORS.rebound}`}>反動</Badge>}
                      {w.notStable && <Badge variant="outline" className={`text-xs ${FLAG_COLORS.unstable}`}>不安定</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => setEditTarget(w)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
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
        {canScrollDown && (
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-12 rounded-b-md bg-gradient-to-t from-muted/80 to-transparent" />
        )}
        </div>
      )}

      {paginate && !isFiltered && pageNav}

      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-lg">
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

      <Dialog open={!!memoTarget} onOpenChange={(o) => !o && setMemoTarget(null)}>
        <DialogContent className="max-w-[calc(100%-3rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[10px] sm:text-xs text-muted-foreground font-medium">
              {memoTarget?.exercise} のメモ
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm sm:text-base whitespace-pre-wrap">{memoTarget?.memo}</p>
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
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
