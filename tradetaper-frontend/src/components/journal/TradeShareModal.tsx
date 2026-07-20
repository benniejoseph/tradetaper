"use client";

import React, { useMemo, useRef, useState } from "react";
import { format as formatDateFns } from "date-fns";
import { Copy, Download, Loader2, Share2 } from "lucide-react";
import toast from "react-hot-toast";
import Modal from "@/components/ui/Modal";
import { Trade } from "@/types/trade";

type SharePresetId = "square" | "portrait" | "story" | "landscape";

interface SharePreset {
  id: SharePresetId;
  label: string;
  dimensionsLabel: string;
  width: number;
  height: number;
  useCase: string;
}

interface TradeShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade;
}

type SocialPlatform = "x" | "linkedin" | "telegram" | "whatsapp";

const SHARE_PRESETS: SharePreset[] = [
  {
    id: "square",
    label: "Square",
    dimensionsLabel: "1080 × 1080",
    width: 1080,
    height: 1080,
    useCase: "Instagram post, X, LinkedIn",
  },
  {
    id: "portrait",
    label: "Portrait",
    dimensionsLabel: "1080 × 1350",
    width: 1080,
    height: 1350,
    useCase: "Instagram feed",
  },
  {
    id: "story",
    label: "Story",
    dimensionsLabel: "1080 × 1920",
    width: 1080,
    height: 1920,
    useCase: "Stories / Reels cover",
  },
  {
    id: "landscape",
    label: "Landscape",
    dimensionsLabel: "1200 × 675",
    width: 1200,
    height: 675,
    useCase: "X / LinkedIn wide",
  },
];

const previewMaxWidthMap: Record<SharePresetId, string> = {
  square: "max-w-[560px]",
  portrait: "max-w-[430px]",
  story: "max-w-[390px]",
  landscape: "max-w-[760px]",
};

const formatPrice = (value: number | undefined | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatCurrency = (value: number | undefined | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  const amount = Number(value);
  const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
  return `${sign}$${Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatPercent = (value: number | null): string => {
  if (value === null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
};

const calcReturnPercent = (trade: Trade): number | null => {
  if (
    trade.entryPrice === undefined ||
    trade.entryPrice === null ||
    trade.quantity === undefined ||
    trade.quantity === null ||
    trade.profitOrLoss === undefined ||
    trade.profitOrLoss === null
  ) {
    return null;
  }

  const base = trade.entryPrice * trade.quantity;
  if (!base) return null;
  return (trade.profitOrLoss / base) * 100;
};

const formatTradeDate = (trade: Trade): string => {
  const value = trade.exitDate || trade.entryDate;
  if (!value) return "Date unavailable";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Date unavailable";
    return formatDateFns(date, "MMM dd, yyyy • HH:mm");
  } catch {
    return "Date unavailable";
  }
};

const createFilename = (trade: Trade, preset: SharePreset): string => {
  const symbol = String(trade.symbol || "trade")
    .replace(/[^a-z0-9]/gi, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
  const nowStamp = formatDateFns(new Date(), "yyyyMMdd-HHmm");
  return `tradetaper-${symbol}-${preset.id}-${nowStamp}.png`;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(objectUrl);
};

const buildCaption = (trade: Trade, hidePrices: boolean, hideAccount: boolean): string => {
  const direction = String(trade.direction || "trade").toUpperCase();
  const sessionText = trade.session ? ` | Session: ${trade.session}` : "";
  const accountText = hideAccount ? "" : trade.account?.name ? ` | Account: ${trade.account.name}` : "";
  const perfText = hidePrices
    ? "Disciplined execution review logged."
    : `${formatCurrency(trade.profitOrLoss)} | Return ${formatPercent(calcReturnPercent(trade))}`;

  return `${trade.symbol} ${direction}\n${perfText}${sessionText}${accountText}\nLogged with TradeTaper #tradingjournal #tradetaper`;
};

const obfuscate = (hidden: boolean, value: string) => (hidden ? "••••" : value);

const buildShareIntentUrl = (platform: SocialPlatform, caption: string): string => {
  const siteUrl = "https://www.tradetaper.com";
  const encodedCaption = encodeURIComponent(caption);
  const encodedCaptionWithSite = encodeURIComponent(`${caption}\n${siteUrl}`);

  switch (platform) {
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedCaptionWithSite}`;
    case "linkedin":
      return `https://www.linkedin.com/feed/?shareActive=true&text=${encodedCaptionWithSite}`;
    case "telegram":
      return `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodedCaption}`;
    case "whatsapp":
      return `https://wa.me/?text=${encodedCaptionWithSite}`;
    default:
      return siteUrl;
  }
};

const getStorySymbolClass = (symbol: string | undefined): string => {
  const length = (symbol || "").trim().length;
  if (length <= 6) return "text-[68px]";
  if (length <= 8) return "text-[62px]";
  if (length <= 10) return "text-[56px]";
  return "text-[48px]";
};

const getNonStorySymbolClass = (symbol: string | undefined, presetId: SharePresetId): string => {
  const length = (symbol || "").trim().length;
  if (presetId === "landscape") {
    if (length <= 6) return "text-[52px]";
    if (length <= 8) return "text-[46px]";
    if (length <= 10) return "text-[40px]";
    return "text-[34px]";
  }
  if (presetId === "portrait") {
    if (length <= 6) return "text-[28px]";
    if (length <= 8) return "text-[24px]";
    if (length <= 10) return "text-[22px]";
    return "text-[20px]";
  }
  if (length <= 6) return "text-[62px]";
  if (length <= 8) return "text-[56px]";
  if (length <= 10) return "text-[50px]";
  return "text-[44px]";
};

const TradeShareCard: React.FC<{
  trade: Trade;
  preset: SharePreset;
  hidePrices: boolean;
  hideAccount: boolean;
}> = ({ trade, preset, hidePrices, hideAccount }) => {
  const isWin = (trade.profitOrLoss ?? 0) >= 0;
  const direction = String(trade.direction || "trade").toUpperCase();
  const returnPercent = calcReturnPercent(trade);
  const pnlClass = isWin ? "text-emerald-300" : "text-red-300";
  const directionClass =
    direction === "LONG"
      ? "border-emerald-300/45 bg-emerald-400/15 text-emerald-200"
      : "border-red-300/45 bg-red-400/15 text-red-200";
  const isStory = preset.id === "story";
  const isLandscape = preset.id === "landscape";
  const isPortrait = preset.id === "portrait";
  const isSquare = preset.id === "square";
  const symbolClass = isStory
    ? getStorySymbolClass(trade.symbol)
    : getNonStorySymbolClass(trade.symbol, preset.id);
  const rMultipleValue =
    trade.rMultiple !== undefined && trade.rMultiple !== null
      ? `${trade.rMultiple.toFixed(2)}R`
      : formatPercent(returnPercent);

  return (
    <div
      className={`relative h-full w-full overflow-hidden border bg-[#040A09] text-white ${
        isStory ? "rounded-[36px] border-emerald-400/30" : "rounded-[28px] border-emerald-400/25"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(16,185,129,0.28),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_12%,rgba(16,185,129,0.2),transparent_44%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(4,10,9,0.94),rgba(7,24,18,0.9))]" />
      {isStory && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-black/45 via-black/15 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
        </>
      )}

      <div
        className={`relative flex h-full flex-col ${
          isStory ? "p-8 pt-10 pb-8" : isLandscape ? "p-6" : "p-8"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className={`flex items-center ${isLandscape ? "gap-2.5" : "gap-3"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tradetaperLogo.png"
              alt="TradeTaper"
              className={`${isLandscape ? "h-9 w-9" : "h-11 w-11"} rounded-xl object-contain`}
            />
            <div>
              <p className={`${isLandscape ? "text-base" : "text-lg"} font-bold tracking-tight text-white`}>
                TradeTaper
              </p>
              <p className={`${isLandscape ? "text-[10px]" : "text-xs"} uppercase tracking-[0.16em] text-emerald-200/80`}>
                {isStory ? "Trade Result" : "Trade Result Share"}
              </p>
            </div>
          </div>
          <span
            className={`rounded-lg border ${isLandscape ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs"} font-bold tracking-[0.14em] ${directionClass}`}
          >
            {direction}
          </span>
        </div>

        {isStory ? (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/14 bg-white/[0.05] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/75">
                {trade.assetType || "Asset"}
              </p>
              <h2 className={`mt-1 max-w-full truncate font-black leading-[0.95] tracking-tight ${symbolClass}`}>
                {trade.symbol || "SYMBOL"}
              </h2>
              <p className="mt-2 text-sm text-emerald-100/80">{formatTradeDate(trade)}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">Status</p>
                  <p className="truncate text-xs font-semibold text-zinc-100">{trade.status || "—"}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400">Timeframe</p>
                  <p className="truncate text-xs font-semibold text-zinc-100">{trade.timeframe || "—"}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-white/14 bg-white/[0.05] p-4 text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-300">Net P&L</p>
              <p className={`mt-1 break-words text-[36px] font-black leading-none ${pnlClass}`}>
                {obfuscate(hidePrices, formatCurrency(trade.profitOrLoss))}
              </p>
              <p className={`mt-1 text-xl font-bold ${pnlClass}`}>
                {obfuscate(hidePrices, formatPercent(returnPercent))}
              </p>
            </div>
          </div>
        ) : isLandscape ? (
          <div className="mt-4 grid grid-cols-[minmax(0,1fr)_300px] gap-3">
            <div className="rounded-2xl border border-white/14 bg-white/[0.05] p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/75">{trade.assetType || "Asset"}</p>
              <h2 className={`mt-1 truncate font-black leading-none tracking-tight ${symbolClass}`}>
                {trade.symbol || "SYMBOL"}
              </h2>
              <p className="mt-2 text-sm text-emerald-100/80">{formatTradeDate(trade)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-white/12 bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-200">
                  {trade.status || "—"}
                </span>
                <span className="rounded-md border border-white/12 bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-200">
                  {trade.timeframe || "—"}
                </span>
                <span className="rounded-md border border-white/12 bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-200">
                  {trade.session || "—"}
                </span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/14 bg-white/[0.05] p-4 text-right">
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-300">Net P&L</p>
              <p className={`mt-1 break-words text-[46px] font-black leading-none ${pnlClass}`}>
                {obfuscate(hidePrices, formatCurrency(trade.profitOrLoss))}
              </p>
              <p className={`mt-1 text-2xl font-bold ${pnlClass}`}>
                {obfuscate(hidePrices, formatPercent(returnPercent))}
              </p>
            </div>
          </div>
        ) : (
          <div
            className={`mt-7 ${
              isPortrait
                ? "grid grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] items-start gap-3"
                : "flex items-start justify-between gap-5"
            }`}
          >
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-emerald-200/75">{trade.assetType || "Asset"}</p>
              <h2 className={`mt-1 truncate font-black leading-none tracking-tight ${symbolClass}`}>
                {trade.symbol || "SYMBOL"}
              </h2>
              <p className="mt-2 text-sm text-emerald-100/80">{formatTradeDate(trade)}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="rounded-md border border-white/12 bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-200">
                  {trade.status || "—"}
                </span>
                <span className="rounded-md border border-white/12 bg-black/20 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-200">
                  {trade.timeframe || "—"}
                </span>
              </div>
            </div>
            <div className={`min-w-0 rounded-2xl border border-white/14 bg-white/[0.05] text-right ${isPortrait ? "p-3" : "p-4"}`}>
              <p className="text-xs uppercase tracking-[0.14em] text-zinc-300">Net P&L</p>
              <p
                className={`mt-1 break-words ${
                  isSquare ? "text-[34px]" : isPortrait ? "text-[30px]" : "text-[40px]"
                } font-black leading-none tracking-tight ${pnlClass}`}
              >
                {obfuscate(hidePrices, formatCurrency(trade.profitOrLoss))}
              </p>
              <p className={`mt-1 ${isSquare ? "text-base" : isPortrait ? "text-sm" : "text-lg"} font-bold ${pnlClass}`}>
                {obfuscate(hidePrices, formatPercent(returnPercent))}
              </p>
            </div>
          </div>
        )}

        {isSquare ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-300">Entry</p>
              <p className="mt-0.5 truncate text-[22px] font-black leading-none text-white">
                {obfuscate(hidePrices, formatPrice(trade.entryPrice))}
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-300">Exit</p>
              <p className="mt-0.5 truncate text-[22px] font-black leading-none text-white">
                {obfuscate(hidePrices, formatPrice(trade.exitPrice ?? null))}
              </p>
            </div>
            <div className="rounded-2xl border border-white/12 bg-white/[0.04] p-3">
              <p className="text-[10px] uppercase tracking-[0.14em] text-zinc-300">R-Multiple</p>
              <p className="mt-0.5 truncate text-[22px] font-black leading-none text-white">
                {obfuscate(hidePrices, rMultipleValue)}
              </p>
            </div>
          </div>
        ) : (
          <div className={`${isStory ? "mt-4" : isLandscape ? "mt-4 grid-cols-4" : "mt-5"} grid grid-cols-2 gap-3`}>
          <div className={`rounded-2xl border border-white/12 bg-white/[0.04] ${isStory ? "p-2.5" : "p-3"}`}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">Entry</p>
            <p
              className={`${isStory ? "mt-0.5 text-[30px]" : isLandscape ? "mt-1 text-[24px]" : "mt-1 text-2xl"} font-black leading-none text-white`}
            >
              {obfuscate(hidePrices, formatPrice(trade.entryPrice))}
            </p>
          </div>
          <div className={`rounded-2xl border border-white/12 bg-white/[0.04] ${isStory ? "p-2.5" : "p-3"}`}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">Exit</p>
            <p
              className={`${isStory ? "mt-0.5 text-[30px]" : isLandscape ? "mt-1 text-[24px]" : "mt-1 text-2xl"} font-black leading-none text-white`}
            >
              {obfuscate(hidePrices, formatPrice(trade.exitPrice ?? null))}
            </p>
          </div>
          <div className={`rounded-2xl border border-white/12 bg-white/[0.04] ${isStory ? "p-2.5" : "p-3"}`}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">Session</p>
            <p
              className={`${isStory ? "mt-0.5 text-lg" : isLandscape ? "mt-1 text-base" : "mt-1 text-xl"} truncate font-bold text-zinc-100`}
            >
              {trade.session || "—"}
            </p>
          </div>
          <div className={`rounded-2xl border border-white/12 bg-white/[0.04] ${isStory ? "p-2.5" : "p-3"}`}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-300">Account</p>
            <p
              className={`${isStory ? "mt-0.5 text-lg" : isLandscape ? "mt-1 text-base" : "mt-1 text-xl"} truncate font-bold text-zinc-100`}
            >
              {hideAccount ? "Hidden" : trade.account?.name || "Default"}
            </p>
          </div>
          </div>
        )}

        {isStory ? (
          <div className="mt-auto flex items-end justify-between gap-4 pt-4">
            <p className="text-sm text-emerald-200/85">#tradetaper #tradingjournal</p>
            <p className="text-right text-xs uppercase tracking-[0.14em] text-zinc-400">
              Review. Execute. Improve.
            </p>
          </div>
        ) : (
          <div className={`mt-auto flex items-end justify-between gap-4 ${isLandscape ? "pt-3" : "pt-5"}`}>
            <p className="text-sm text-emerald-200/85">#tradetaper #tradingjournal</p>
            <p className="text-right text-xs uppercase tracking-[0.14em] text-zinc-400">
              Review. Execute. Improve.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TradeShareModal({ isOpen, onClose, trade }: TradeShareModalProps) {
  const [presetId, setPresetId] = useState<SharePresetId>("square");
  const [hidePrices, setHidePrices] = useState(false);
  const [hideAccount, setHideAccount] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<"share" | "download" | null>(null);
  const captureRef = useRef<HTMLDivElement | null>(null);

  const activePreset = useMemo(
    () => SHARE_PRESETS.find((preset) => preset.id === presetId) ?? SHARE_PRESETS[0],
    [presetId],
  );

  const caption = useMemo(
    () => buildCaption(trade, hidePrices, hideAccount),
    [hideAccount, hidePrices, trade],
  );

  const generatePngBlob = async (): Promise<{ blob: Blob; filename: string }> => {
    const exportNode = captureRef.current;
    if (!exportNode) {
      throw new Error("Share preview is not ready yet.");
    }

    const html2canvasModule = await import("html2canvas");
    const html2canvas = html2canvasModule.default;
    const scale = Math.min(3, Math.max(2, Math.ceil(window.devicePixelRatio || 1)));
    const canvas = await html2canvas(exportNode, {
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      scale,
      logging: false,
    });

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/png", 1);
    });

    if (!blob) {
      throw new Error("Unable to render PNG image.");
    }

    return { blob, filename: createFilename(trade, activePreset) };
  };

  const handleCopyCaption = async () => {
    try {
      await navigator.clipboard.writeText(caption);
      toast.success("Caption copied.");
    } catch (error) {
      console.error("Failed to copy share caption:", error);
      toast.error("Unable to copy caption.");
    }
  };

  const handleDownload = async () => {
    try {
      setActionInProgress("download");
      const { blob, filename } = await generatePngBlob();
      downloadBlob(blob, filename);
      toast.success("Share image downloaded.");
    } catch (error) {
      console.error("Failed to download share image:", error);
      toast.error(error instanceof Error ? error.message : "Unable to download image.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleShare = async () => {
    try {
      setActionInProgress("share");
      const { blob, filename } = await generatePngBlob();
      const imageFile = new File([blob], filename, { type: "image/png" });

      const canUseFileShare =
        typeof navigator.share === "function" &&
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [imageFile] });

      if (canUseFileShare) {
        await navigator.share({
          title: `${trade.symbol} trade result`,
          text: caption,
          files: [imageFile],
        });
        toast.success("Trade result shared.");
        return;
      }

      downloadBlob(blob, filename);
      await navigator.clipboard.writeText(caption);
      toast.success("Image downloaded. Caption copied for posting.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      console.error("Failed to share trade result:", error);
      toast.error(error instanceof Error ? error.message : "Unable to share image.");
    } finally {
      setActionInProgress(null);
    }
  };

  const handleShareToPlatform = async (platform: SocialPlatform) => {
    let shareWindow: Window | null = null;

    try {
      shareWindow = window.open("", "_blank", "noopener,noreferrer");

      setActionInProgress("share");
      const { blob, filename } = await generatePngBlob();
      downloadBlob(blob, filename);

      try {
        await navigator.clipboard.writeText(caption);
      } catch (clipboardError) {
        console.error("Failed to copy caption before social intent:", clipboardError);
      }

      const intentUrl = buildShareIntentUrl(platform, caption);

      if (shareWindow && !shareWindow.closed) {
        shareWindow.location.href = intentUrl;
        shareWindow.focus();
      } else {
        window.open(intentUrl, "_blank", "noopener,noreferrer");
      }

      toast.success("Image downloaded. Caption ready in social composer.");
    } catch (error) {
      if (shareWindow && !shareWindow.closed) {
        shareWindow.close();
      }
      console.error("Failed to open social share intent:", error);
      toast.error(error instanceof Error ? error.message : "Unable to prepare social share.");
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Share Trade Result"
      description="Choose a social format, preview your trade card, and share or download the image."
      size="xl"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/8 p-3 text-xs text-emerald-700 dark:text-emerald-200">
          Social platforms usually require manual posting on desktop. Use Share on mobile, or download image + copy
          caption for desktop posting.
        </div>

        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {SHARE_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setPresetId(preset.id)}
              className={`rounded-xl border px-3 py-2 text-left transition ${
                preset.id === activePreset.id
                  ? "border-emerald-500/50 bg-emerald-500/15 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]"
                  : "border-zinc-300/70 bg-white/70 hover:border-emerald-400/50 dark:border-white/15 dark:bg-white/[0.02] dark:hover:border-emerald-500/40"
              }`}
            >
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{preset.label}</p>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400">{preset.dimensionsLabel}</p>
              <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">{preset.useCase}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-500"
              checked={hidePrices}
              onChange={(event) => setHidePrices(event.target.checked)}
            />
            Hide price + P&L
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-300/70 bg-white/70 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-300">
            <input
              type="checkbox"
              className="h-4 w-4 accent-emerald-500"
              checked={hideAccount}
              onChange={(event) => setHideAccount(event.target.checked)}
            />
            Hide account name
          </label>
        </div>

        <div className="rounded-2xl border border-zinc-200/80 bg-zinc-50/70 p-3 dark:border-white/10 dark:bg-black/40">
          <div
            className={`mx-auto w-full overflow-hidden rounded-2xl border border-emerald-500/25 ${previewMaxWidthMap[activePreset.id]}`}
            style={{ aspectRatio: `${activePreset.width} / ${activePreset.height}` }}
          >
            <TradeShareCard
              trade={trade}
              preset={activePreset}
              hidePrices={hidePrices}
              hideAccount={hideAccount}
            />
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-3 dark:border-white/10 dark:bg-white/[0.02]">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            Caption Preview
          </p>
          <p className="whitespace-pre-line break-words text-sm text-zinc-700 dark:text-zinc-200">{caption}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => handleShareToPlatform("x")}
            disabled={actionInProgress !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/80 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
          >
            X
          </button>
          <button
            type="button"
            onClick={() => handleShareToPlatform("linkedin")}
            disabled={actionInProgress !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/80 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
          >
            LinkedIn
          </button>
          <button
            type="button"
            onClick={() => handleShareToPlatform("telegram")}
            disabled={actionInProgress !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/80 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
          >
            Telegram
          </button>
          <button
            type="button"
            onClick={() => handleShareToPlatform("whatsapp")}
            disabled={actionInProgress !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/80 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
          >
            WhatsApp
          </button>
          <button
            type="button"
            onClick={handleCopyCaption}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/80 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
          >
            <Copy className="h-4 w-4" />
            Copy Caption
          </button>
          <button
            type="button"
            onClick={handleDownload}
            disabled={actionInProgress !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300/80 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-emerald-400 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.02] dark:text-zinc-200 dark:hover:border-emerald-500/40 dark:hover:text-emerald-300"
          >
            {actionInProgress === "download" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download PNG
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={actionInProgress !== null}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-60 dark:text-emerald-300"
          >
            {actionInProgress === "share" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            Share
          </button>
        </div>
      </div>

      <div className="pointer-events-none fixed -left-[10000px] -top-[10000px] opacity-0" aria-hidden="true">
        <div ref={captureRef} style={{ width: activePreset.width, height: activePreset.height }}>
          <TradeShareCard
            trade={trade}
            preset={activePreset}
            hidePrices={hidePrices}
            hideAccount={hideAccount}
          />
        </div>
      </div>
    </Modal>
  );
}
