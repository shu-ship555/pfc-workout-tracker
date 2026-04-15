"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Zap,
  Type,
  Camera,
  Images,
  Loader2,
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from "lucide-react";
import type { MealEntry, MealLike } from "@/lib/types";
import { PFCInputGrid } from "@/components/pfc-input-grid";
import type { MealAnalysis } from "@/lib/gemini";
import { PFCGrid } from "@/components/pfc-grid";

// --- Preset types & storage ---

type Preset = {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carb: number;
};

const DEFAULT_PRESETS: Preset[] = [
  { id: "d1", name: "いつもの朝ごはん",          kcal: 341,  protein: 33.7, fat: 2.7,  carb: 45.6 },
  { id: "d2", name: "いつもの昼ごはん",          kcal: 629,  protein: 44.3, fat: 17.1, carb: 80.4 },
  { id: "d3", name: "EAA",                       kcal: 47.5, protein: 7.3,  fat: 0.05, carb: 4.5  },
  { id: "d4", name: "プロテイン",                kcal: 111,  protein: 21,   fat: 0,    carb: 6.75 },
  { id: "d5", name: "いつものチョコレートアイス", kcal: 77,   protein: 1.3,  fat: 2.3,  carb: 13   },
  { id: "d6", name: "たきたろう",                kcal: 670,  protein: 31,   fat: 20,   carb: 82   },
];

const STORAGE_KEY = "pfc-tracker-presets";
const MAX_PRESETS = 10;

function loadPresets(): Preset[] {
  if (typeof window === "undefined") return DEFAULT_PRESETS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEFAULT_PRESETS;
  } catch {
    return DEFAULT_PRESETS;
  }
}

function persistPresets(presets: Preset[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

// --- Component ---

type MealData = MealLike;

type Step = "input" | "analyzing" | "error" | "preview" | "saving";

type Props = {
  onSuccess: (meal: MealEntry) => void;
  onCancel?: () => void;
};

export function MealForm({ onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<Step>("input");
  const [previewData, setPreviewData] = useState<MealData | null>(null);
  const [isImageSource, setIsImageSource] = useState(false);
  const [supplementDone, setSupplementDone] = useState(false);

  // text tab
  const [textInput, setTextInput] = useState("");

  // image tab
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageObjectUrl, setImageObjectUrl] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState("image/jpeg");

  // supplement (image refinement)
  const [supplement, setSupplement] = useState("");

  const [error, setError] = useState<string | null>(null);

  // direct input
  const [directInput, setDirectInput] = useState({ name: "", kcal: 0, protein: 0, fat: 0, carb: 0 });
  const [directSaving, setDirectSaving] = useState(false);
  const [directError, setDirectError] = useState<string | null>(null);

  // presets
  const [presets, setPresets] = useState<Preset[]>(() => loadPresets());
  const [showManage, setShowManage] = useState(false);
  const [newPreset, setNewPreset] = useState<Omit<Preset, "id">>({
    name: "", kcal: 0, protein: 0, fat: 0, carb: 0,
  });

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const libraryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
    };
  }, [imageObjectUrl]);

  // --- helpers ---

  function toMealData(analysis: MealAnalysis): MealData {
    return {
      name: analysis.name,
      kcal: analysis.kcal,
      protein: analysis.p,
      fat: analysis.f,
      carb: analysis.c,
    };
  }

  function toAnalysis(data: MealData): MealAnalysis {
    return { name: data.name, kcal: data.kcal, p: data.protein, f: data.fat, c: data.carb };
  }

  // --- preset management ---

  function handleAddPreset() {
    if (!newPreset.name.trim() || presets.length >= MAX_PRESETS) return;
    const updated = [...presets, { ...newPreset, id: `custom-${Date.now()}` }];
    setPresets(updated);
    persistPresets(updated);
    setNewPreset({ name: "", kcal: 0, protein: 0, fat: 0, carb: 0 });
  }

  function handleDeletePreset(id: string) {
    const updated = presets.filter((p) => p.id !== id);
    setPresets(updated);
    persistPresets(updated);
  }

  // --- direct save ---

  async function handleDirectSave() {
    if (!directInput.name.trim()) return;
    setDirectSaving(true);
    setDirectError(null);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(directInput),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "保存に失敗しました");
      const meal: MealEntry = await res.json();
      onSuccess(meal);
    } catch (e) {
      setDirectError(e instanceof Error ? e.message : "保存に失敗しました");
      setDirectSaving(false);
    }
  }

  // --- quick preset select ---

  function handlePresetSelect(preset: Preset) {
    setPreviewData({
      name: preset.name,
      kcal: preset.kcal,
      protein: preset.protein,
      fat: preset.fat,
      carb: preset.carb,
    });
    setIsImageSource(false);
    setSupplementDone(false);
    setStep("preview");
  }

  // --- analyze (text / image 共通) ---

  async function handleAnalyze(body: Record<string, unknown>, fromImage: boolean) {
    setStep("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "解析に失敗しました");
      const data: MealAnalysis = await res.json();
      setPreviewData(toMealData(data));
      setIsImageSource(fromImage);
      setSupplementDone(false);
      if (fromImage) setSupplement("");
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "解析に失敗しました");
      setStep("error");
    }
  }

  // --- image upload ---

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageMime(file.type || "image/jpeg");
    if (imageObjectUrl) URL.revokeObjectURL(imageObjectUrl);
    setImageObjectUrl(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  }

  // --- supplement refinement ---

  async function handleRefine() {
    if (!supplement.trim() || !previewData) return;
    setStep("analyzing");
    setError(null);
    try {
      const res = await fetch("/api/meals/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prev: toAnalysis(previewData), supplement }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "再計算に失敗しました");
      const data: MealAnalysis = await res.json();
      setPreviewData(toMealData(data));
      setSupplement("");
      setSupplementDone(true);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "再計算に失敗しました");
      setStep("preview");
    }
  }

  // --- save ---

  async function handleSave() {
    if (!previewData) return;
    setStep("saving");
    setError(null);
    try {
      const res = await fetch("/api/meals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(previewData),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "保存に失敗しました");
      const meal: MealEntry = await res.json();
      onSuccess(meal);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setStep("preview");
    }
  }

  // --- render: analyzing ---

  if (step === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Geminiが解析中...</p>
      </div>
    );
  }

  // --- render: error ---

  if (step === "error") {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-5 flex flex-col items-center gap-2 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm font-medium text-destructive">解析に失敗しました</p>
          {error && (
            <p className="text-xs text-muted-foreground break-all">{error}</p>
          )}
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setError(null); setStep("input"); }}
          >
            戻る
          </Button>
        </div>
      </div>
    );
  }

  // --- render: preview / saving ---

  if ((step === "preview" || step === "saving") && previewData) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card px-4 pt-3 pb-4 space-y-3">
          <p className="text-sm font-medium">{previewData.name}</p>
          <PFCGrid
            kcal={previewData.kcal}
            protein={previewData.protein}
            fat={previewData.fat}
            carb={previewData.carb}
          />
        </div>

        {isImageSource && !supplementDone && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              補足情報（任意）
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="例：ごはんは200g、ポテトは残した"
                value={supplement}
                onChange={(e) => setSupplement(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleRefine(); }}
                className="text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!supplement.trim()}
                onClick={handleRefine}
              >
                再計算
              </Button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setPreviewData(null); setStep("input"); }}
            disabled={step === "saving"}
          >
            戻る
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={step === "saving"}
            className="hover:bg-primary/80"
          >
            {step === "saving" ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" />保存中...</>
            ) : "記録する"}
          </Button>
        </div>

      </div>
    );
  }

  // --- render: input ---

  return (
    <div className="space-y-4">
      <Tabs defaultValue="quick">
        <TabsList className="w-full">
          <TabsTrigger value="quick" className="flex-1">
            <Zap className="h-3.5 w-3.5" />
            クイック
          </TabsTrigger>
          <TabsTrigger value="text" className="flex-1">
            <Type className="h-3.5 w-3.5" />
            テキスト
          </TabsTrigger>
          <TabsTrigger value="image" className="flex-1">
            <Camera className="h-3.5 w-3.5" />
            写真
          </TabsTrigger>
        </TabsList>

        {/* クイック */}
        <TabsContent value="quick" className="space-y-3 mt-3">
          {presets.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className="text-left rounded-lg border bg-card px-3 pt-2 pb-2.5 hover:bg-accent transition-colors"
                >
                  <p className="text-sm font-medium truncate">{preset.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {preset.kcal} kcal
                  </p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">
              プリセットがありません
            </p>
          )}

          <Separator />

          {/* 直接入力 */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">直接入力</p>
            <Input
              placeholder="料理名"
              value={directInput.name}
              onChange={(e) => setDirectInput((p) => ({ ...p, name: e.target.value }))}
              className="text-sm h-8"
            />
            <PFCInputGrid
              values={directInput}
              onChange={(key, value) => setDirectInput((p) => ({ ...p, [key]: value }))}
            />
            {directError && <p className="text-xs text-destructive">{directError}</p>}
            <Button
              type="button"
              size="sm"
              className="w-full h-8 hover:bg-primary/80"
              disabled={!directInput.name.trim() || directSaving}
              onClick={handleDirectSave}
            >
              {directSaving ? (
                <><Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />保存中...</>
              ) : (
                <><Plus className="h-3.5 w-3.5 mr-1" />記録する</>
              )}
            </Button>
          </div>

          <Separator />

          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setShowManage(!showManage)}
          >
            {showManage ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
            プリセットを管理 ({presets.length}/{MAX_PRESETS})
          </button>

          {showManage && (
            <div className="rounded-lg border px-3 pt-3 pb-3 space-y-3">
              {presets.length > 0 && (
                <div className="space-y-2">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <span className="flex-1 truncate">{preset.name}</span>
                      <span className="text-xs text-muted-foreground font-mono shrink-0">
                        {preset.kcal} kcal
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(preset.id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {presets.length < MAX_PRESETS && (
                <>
                  {presets.length > 0 && <Separator />}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      新規追加
                    </p>
                    <Input
                      placeholder="料理名"
                      value={newPreset.name}
                      onChange={(e) =>
                        setNewPreset((p) => ({ ...p, name: e.target.value }))
                      }
                      className="text-sm h-8"
                    />
                    <PFCInputGrid
                      values={newPreset}
                      onChange={(key, value) => setNewPreset((p) => ({ ...p, [key]: value }))}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="w-full h-8"
                      disabled={!newPreset.name.trim()}
                      onClick={handleAddPreset}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      追加
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </TabsContent>

        {/* テキスト */}
        <TabsContent value="text" className="space-y-3 mt-3">
          <div className="space-y-1">
            <Label htmlFor="meal-text">料理名または説明</Label>
            <Input
              id="meal-text"
              placeholder="例：鶏むね肉200g、ブロッコリー"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAnalyze({ text: textInput }, false);
              }}
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="button"
            className="w-full hover:bg-primary/80"
            disabled={!textInput.trim()}
            onClick={() => handleAnalyze({ text: textInput }, false)}
          >
            Geminiで解析
          </Button>
        </TabsContent>

        {/* 写真 */}
        <TabsContent value="image" className="space-y-3 mt-3">
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
          <input
            type="file"
            ref={libraryInputRef}
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />

          {imageObjectUrl ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageObjectUrl}
                alt="選択した画像"
                className="w-full max-h-40 rounded-lg object-contain bg-muted/30"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                  撮り直す
                </button>
                <button
                  type="button"
                  onClick={() => libraryInputRef.current?.click()}
                  className="flex items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Images className="h-3.5 w-3.5" />
                  ライブラリ
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="rounded-lg border-2 border-dashed border-border py-6 flex flex-col items-center gap-2 hover:bg-accent transition-colors"
              >
                <Camera className="h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium">カメラ</p>
              </button>
              <button
                type="button"
                onClick={() => libraryInputRef.current?.click()}
                className="rounded-lg border-2 border-dashed border-border py-6 flex flex-col items-center gap-2 hover:bg-accent transition-colors"
              >
                <Images className="h-7 w-7 text-muted-foreground" />
                <p className="text-sm font-medium">ライブラリ</p>
              </button>
            </div>
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button
            type="button"
            className="w-full hover:bg-primary/80"
            disabled={!imageBase64}
            onClick={() => handleAnalyze({ image: imageBase64, mimeType: imageMime }, true)}
          >
            Geminiで解析
          </Button>
        </TabsContent>
      </Tabs>

      {onCancel && (
        <div className="flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            キャンセル
          </Button>
        </div>
      )}
    </div>
  );
}

