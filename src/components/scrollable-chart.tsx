/**
 * チャートを横スクロール可能なコンテナで包む共通ラッパー。
 * データ件数に応じて最小幅を確保し、オーバーフロー時は水平スクロールを有効にする。
 */

type Props = {
  dataLength: number;
  children: React.ReactNode;
};

const MIN_WIDTH_PER_ITEM = 28;
const MIN_TOTAL_WIDTH = 320;

export function ScrollableChart({ dataLength, children }: Props) {
  const minWidth = Math.max(dataLength * MIN_WIDTH_PER_ITEM, MIN_TOTAL_WIDTH);
  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <div style={{ minWidth }}>{children}</div>
    </div>
  );
}
