"use client";

import React, { useEffect, useMemo, useState } from "react";
import { FaArrowLeft, FaCloud, FaDesktop, FaUserCircle } from "react-icons/fa";
import Modal from "@/components/ui/Modal";
import MT5AccountForm from "./MT5AccountForm";
import { CreateMT5AccountPayload } from "@/store/features/mt5AccountsSlice";

export type AccountCreationMode = "manual" | "metaapi" | "local";

export interface ManualAccountCreateInput {
  name: string;
  balance: number;
  currency?: string;
  description?: string;
  target?: number;
  accountCategory?: "personal" | "prop_firm";
  propFirmPhase?: string;
  propMaxLoss?: number;
  propDailyMaxLoss?: number;
}

interface AccountCreationFlowModalProps {
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onCreateManual: (payload: ManualAccountCreateInput) => Promise<void>;
  onCreateMt5: (
    payload: CreateMT5AccountPayload,
    mode: "metaapi" | "local",
  ) => Promise<void>;
}

type ManualFormState = {
  name: string;
  balance: string;
  currency: string;
  description: string;
  target: string;
  accountCategory: "personal" | "prop_firm";
  propFirmPhase: string;
  propMaxLoss: string;
  propDailyMaxLoss: string;
};

const INITIAL_MANUAL_FORM: ManualFormState = {
  name: "",
  balance: "",
  currency: "USD",
  description: "",
  target: "",
  accountCategory: "personal",
  propFirmPhase: "",
  propMaxLoss: "",
  propDailyMaxLoss: "",
};

export default function AccountCreationFlowModal({
  isOpen,
  isSubmitting,
  onClose,
  onCreateManual,
  onCreateMt5,
}: AccountCreationFlowModalProps) {
  const [mode, setMode] = useState<AccountCreationMode | null>(null);
  const [manualForm, setManualForm] = useState<ManualFormState>(
    INITIAL_MANUAL_FORM,
  );
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMode(null);
      setManualForm(INITIAL_MANUAL_FORM);
      setManualError(null);
    }
  }, [isOpen]);

  const title = useMemo(() => {
    if (mode === "manual") return "Create Manual Account";
    if (mode === "metaapi") return "Create MT5 Cloud Sync Account";
    if (mode === "local") return "Create Local Sync Account";
    return "Add Account";
  }, [mode]);

  const description = useMemo(() => {
    if (mode === "manual") {
      return "Track manual or imported trading performance.";
    }
    if (mode === "metaapi") {
      return "Create an MT5 account for MetaAPI cloud workflow.";
    }
    if (mode === "local") {
      return "Create an MT5 account and continue to Local Terminal setup.";
    }
    return "Choose how you want to create and sync this account.";
  }, [mode]);

  const closeModal = () => {
    if (isSubmitting) return;
    onClose();
  };

  const parseOptionalNumber = (value: string): number | undefined => {
    const normalized = value.trim();
    if (!normalized) return undefined;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : undefined;
  };

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setManualError(null);

    if (!manualForm.name.trim()) {
      setManualError("Account name is required.");
      return;
    }

    const balance = Number(manualForm.balance);
    if (!Number.isFinite(balance) || balance < 0) {
      setManualError("Enter a valid starting balance.");
      return;
    }

    const target = parseOptionalNumber(manualForm.target);
    const propMaxLoss = parseOptionalNumber(manualForm.propMaxLoss);
    const propDailyMaxLoss = parseOptionalNumber(manualForm.propDailyMaxLoss);

    if (manualForm.accountCategory === "prop_firm" && target === undefined) {
      setManualError("Profit target is required for Prop Firm accounts.");
      return;
    }

    try {
      await onCreateManual({
        name: manualForm.name.trim(),
        balance,
        currency: manualForm.currency.trim().toUpperCase() || "USD",
        description: manualForm.description.trim() || undefined,
        target,
        accountCategory: manualForm.accountCategory,
        propFirmPhase:
          manualForm.accountCategory === "prop_firm"
            ? manualForm.propFirmPhase.trim() || undefined
            : undefined,
        propMaxLoss:
          manualForm.accountCategory === "prop_firm"
            ? propMaxLoss
            : undefined,
        propDailyMaxLoss:
          manualForm.accountCategory === "prop_firm"
            ? propDailyMaxLoss
            : undefined,
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Failed to create manual account";
      setManualError(message);
    }
  };

  const renderFlowSelector = () => {
    const optionClass =
      "w-full rounded-2xl border px-4 py-4 text-left transition hover:-translate-y-0.5";

    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`${optionClass} border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-gray-800 dark:bg-black/40 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20`}
        >
          <span className="flex items-start gap-3">
            <span className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FaUserCircle className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                Manual Account
              </span>
              <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                For discretionary logging and statement imports.
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("metaapi")}
          className={`${optionClass} border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-gray-800 dark:bg-black/40 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20`}
        >
          <span className="flex items-start gap-3">
            <span className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FaCloud className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                MT5 Cloud Sync
              </span>
              <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                MetaAPI cloud-linked account with explicit sync workflow.
              </span>
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMode("local")}
          className={`${optionClass} border-gray-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-gray-800 dark:bg-black/40 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20`}
        >
          <span className="flex items-start gap-3">
            <span className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">
              <FaDesktop className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">
                Local Sync
              </span>
              <span className="mt-1 block text-xs text-gray-600 dark:text-gray-400">
                Create account now, then finish EA connector setup in Local tab.
              </span>
            </span>
          </span>
        </button>
      </div>
    );
  };

  const renderManualForm = () => {
    return (
      <form onSubmit={handleManualSubmit} className="space-y-4">
        <button
          type="button"
          onClick={() => setMode(null)}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <FaArrowLeft className="h-3 w-3" />
          Back to account type
        </button>

        {manualError && (
          <div className="rounded-xl border border-red-300/60 bg-red-50/80 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {manualError}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Account Name
          </label>
          <input
            type="text"
            value={manualForm.name}
            onChange={(e) =>
              setManualForm((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-black/60 dark:text-white"
            placeholder="e.g. Personal Swing Account"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Starting Balance
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={manualForm.balance}
              onChange={(e) =>
                setManualForm((prev) => ({ ...prev, balance: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-black/60 dark:text-white"
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Currency
            </label>
            <input
              type="text"
              maxLength={3}
              value={manualForm.currency}
              onChange={(e) =>
                setManualForm((prev) => ({ ...prev, currency: e.target.value }))
              }
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-black/60 dark:text-white"
              placeholder="USD"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Account Category
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() =>
                setManualForm((prev) => ({
                  ...prev,
                  accountCategory: "personal",
                }))
              }
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                manualForm.accountCategory === "personal"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              Personal
            </button>
            <button
              type="button"
              onClick={() =>
                setManualForm((prev) => ({
                  ...prev,
                  accountCategory: "prop_firm",
                }))
              }
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition ${
                manualForm.accountCategory === "prop_firm"
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
                  : "border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300"
              }`}
            >
              Prop Firm
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Target
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={manualForm.target}
            onChange={(e) =>
              setManualForm((prev) => ({ ...prev, target: e.target.value }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-black/60 dark:text-white"
            placeholder={
              manualForm.accountCategory === "prop_firm"
                ? "Required for Prop Firm"
                : "Optional"
            }
          />
        </div>

        {manualForm.accountCategory === "prop_firm" && (
          <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-800/60 dark:bg-emerald-900/10 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Phase
              </label>
              <input
                type="text"
                value={manualForm.propFirmPhase}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    propFirmPhase: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-black/60 dark:text-white"
                placeholder="Challenge / Verification / Funded"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Max Loss
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualForm.propMaxLoss}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    propMaxLoss: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-black/60 dark:text-white"
                placeholder="e.g. 12000"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Daily Max Loss
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={manualForm.propDailyMaxLoss}
                onChange={(e) =>
                  setManualForm((prev) => ({
                    ...prev,
                    propDailyMaxLoss: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-black/60 dark:text-white"
                placeholder="e.g. 5000"
              />
            </div>
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Description
          </label>
          <textarea
            rows={3}
            value={manualForm.description}
            onChange={(e) =>
              setManualForm((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 dark:border-gray-700 dark:bg-black/60 dark:text-white"
            placeholder="Optional notes"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={closeModal}
            disabled={isSubmitting}
            className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? "Creating..." : "Create Manual Account"}
          </button>
        </div>
      </form>
    );
  };

  const renderMt5Form = (currentMode: "metaapi" | "local") => {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setMode(null)}
          className="inline-flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <FaArrowLeft className="h-3 w-3" />
          Back to account type
        </button>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-900/10 dark:text-emerald-200">
          {currentMode === "local"
            ? "After creating this account, switch to the Local Sync tab to enable terminal auto-sync and copy connector credentials."
            : "Cloud sync is explicit: account creation links credentials, and historical sync starts when you click Sync."}
        </div>

        <MT5AccountForm
          onSubmit={(payload) =>
            onCreateMt5(payload, currentMode)
          }
          onCancel={() => setMode(null)}
          isSubmitting={isSubmitting}
          submitLabel={
            currentMode === "local"
              ? "Create & Continue to Local Sync"
              : "Create MT5 Account"
          }
        />
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={closeModal}
      title={title}
      description={description}
      size="lg"
    >
      {mode === null && renderFlowSelector()}
      {mode === "manual" && renderManualForm()}
      {mode === "metaapi" && renderMt5Form("metaapi")}
      {mode === "local" && renderMt5Form("local")}
    </Modal>
  );
}
