import { Skeleton } from "@/components/ui/skeleton";

/**
 * PFC・カロリーの4列スケルトンローディング。
 * PFCSummary / LifeLogSummary のローディング表示で共有する。
 */
export function PFCSkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  );
}
