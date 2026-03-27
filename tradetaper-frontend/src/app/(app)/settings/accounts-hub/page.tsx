"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/store/store";
import {
  createAccount,
  fetchAccounts,
  selectAvailableAccounts,
} from "@/store/features/accountSlice";
import {
  createMT5Account,
  CreateMT5AccountPayload,
  fetchMT5Accounts,
  selectMT5Accounts,
} from "@/store/features/mt5AccountsSlice";
import { authApiClient } from "@/services/api";
import {
  terminalService,
  TerminalStatus,
} from "@/services/terminalService";
import ManageAccounts from "@/components/settings/ManageAccounts";
import MT5AccountsList from "@/components/settings/MT5AccountsList";
import AccountCreationFlowModal, {
  ManualAccountCreateInput,
} from "@/components/settings/AccountCreationFlowModal";
import {
  FaCloud,
  FaDesktop,
  FaLink,
  FaPlus,
  FaTasks,
  FaUserCircle,
} from "react-icons/fa";
import LocalMT5SyncPage from "../local-mt5/page";

interface MT5Limits {
  used: number;
  max: number;
  extraSlots: number;
}

type AccountsTab = "manual" | "metaapi" | "local";

const isTerminalEnabled = (status: TerminalStatus | null | undefined): boolean =>
  !!status && ["PENDING", "STARTING", "RUNNING", "STOPPING"].includes(status.status);

const extractErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === "string" && error.trim()) return error;
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message.trim();
    if (message) return message;
  }
  return fallback;
};

export default function SettingsAccountsHubPage() {
  const dispatch = useDispatch<AppDispatch>();
  const manualAccounts = useSelector(selectAvailableAccounts);
  const mt5Accounts = useSelector(selectMT5Accounts);

  const [activeTab, setActiveTab] = useState<AccountsTab>("manual");
  const [mt5Limits, setMt5Limits] = useState<MT5Limits | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, TerminalStatus | null>>({});
  const [isLoadingTopData, setIsLoadingTopData] = useState(true);
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);

  useEffect(() => {
    void dispatch(fetchAccounts());
    void dispatch(fetchMT5Accounts());
  }, [dispatch]);

  const loadTopData = useCallback(async () => {
    setIsLoadingTopData(true);
    try {
      const limitsResult = await authApiClient.get("/mt5-accounts/limits");
      setMt5Limits(limitsResult.data as MT5Limits);
    } catch {
      setMt5Limits(null);
    } finally {
      setIsLoadingTopData(false);
    }
  }, []);

  useEffect(() => {
    void loadTopData();
  }, [loadTopData]);

  const refreshLocalStatuses = useCallback(async () => {
    if (mt5Accounts.length === 0) {
      setLocalStatuses({});
      return;
    }

    const results = await Promise.allSettled(
      mt5Accounts.map(async (account) => {
        const status = await terminalService.getTerminalStatus(account.id);
        if ((status as { enabled?: boolean })?.enabled === false) {
          return { accountId: account.id, status: null as TerminalStatus | null };
        }
        return { accountId: account.id, status: status as TerminalStatus };
      }),
    );

    const nextState: Record<string, TerminalStatus | null> = {};
    results.forEach((result) => {
      if (result.status !== "fulfilled") return;
      nextState[result.value.accountId] = result.value.status;
    });

    setLocalStatuses(nextState);
  }, [mt5Accounts]);

  useEffect(() => {
    void refreshLocalStatuses();
  }, [refreshLocalStatuses]);

  const handleCreateManual = useCallback(
    async (payload: ManualAccountCreateInput) => {
      setIsCreatingAccount(true);
      try {
        await dispatch(createAccount(payload)).unwrap();
        await dispatch(fetchAccounts());
        setActiveTab("manual");
        setIsCreationModalOpen(false);
      } catch (error) {
        throw new Error(
          extractErrorMessage(error, "Failed to create manual account."),
        );
      } finally {
        setIsCreatingAccount(false);
      }
    },
    [dispatch],
  );

  const handleCreateMt5 = useCallback(
    async (payload: CreateMT5AccountPayload, mode: "metaapi" | "local") => {
      setIsCreatingAccount(true);
      try {
        await dispatch(createMT5Account(payload)).unwrap();
        await dispatch(fetchMT5Accounts());
        await loadTopData();
        await refreshLocalStatuses();
        setActiveTab(mode === "local" ? "local" : "metaapi");
        setIsCreationModalOpen(false);
      } catch (error) {
        throw new Error(
          extractErrorMessage(error, "Failed to create MT5 account."),
        );
      } finally {
        setIsCreatingAccount(false);
      }
    },
    [dispatch, loadTopData, refreshLocalStatuses],
  );

  const cloudConnectedCount = useMemo(
    () => mt5Accounts.filter((a) => !!a.metaApiAccountId).length,
    [mt5Accounts],
  );
  const cloudStreamingCount = useMemo(
    () => mt5Accounts.filter((a) => !!a.isStreamingActive).length,
    [mt5Accounts],
  );
  const localEnabledCount = useMemo(
    () => Object.values(localStatuses).filter((status) => isTerminalEnabled(status)).length,
    [localStatuses],
  );

  const activeTabClass =
    "inline-flex w-full items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-semibold transition";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold text-emerald-600 dark:text-emerald-300">
            Accounts Hub
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-4xl">
            One control center for account setup. Manual accounts, MetaAPI cloud sync,
            and Local MT5 sync are isolated workflows. MetaAPI and Local sync cannot
            run together on the same account.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsCreationModalOpen(true)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 sm:w-auto"
        >
          <FaPlus className="h-3.5 w-3.5" />
          Add Account
        </button>
      </div>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/70 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Manual Accounts
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {manualAccounts.length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/70 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            MetaAPI Cloud
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {cloudStreamingCount}/{cloudConnectedCount}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Streaming active / cloud linked
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/70 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            Local Sync Enabled
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {localEnabledCount}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/70 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
            MT5 Slots Used
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {isLoadingTopData ? "…" : mt5Limits ? `${mt5Limits.used}/${mt5Limits.max}` : "—"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Extra slots: {mt5Limits?.extraSlots ?? 0}
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/70 p-4 sm:p-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
          <FaTasks className="w-4 h-4 text-emerald-500" />
          Setup workflow rules
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sm:text-sm">
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 px-3 py-2">
            <strong className="text-gray-900 dark:text-white">Manual accounts</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Track non-MT5 or imported accounts independently.</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 px-3 py-2">
            <strong className="text-gray-900 dark:text-white">MetaAPI cloud</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Cloud sync starts only when you explicitly click sync.</p>
          </div>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/50 px-3 py-2">
            <strong className="text-gray-900 dark:text-white">Local terminal</strong>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Starts only on Enable Auto-Sync and cannot coexist with MetaAPI.</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-black/70 overflow-hidden">
        <div className="grid grid-cols-1 gap-2 border-b border-gray-200 p-3 sm:grid-cols-3 dark:border-gray-800">
          <button
            type="button"
            onClick={() => setActiveTab("manual")}
            className={`${activeTabClass} ${
              activeTab === "manual"
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <FaUserCircle className="w-3.5 h-3.5" /> Manual Accounts
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("metaapi")}
            className={`${activeTabClass} ${
              activeTab === "metaapi"
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <FaCloud className="w-3.5 h-3.5" /> MetaAPI Sync
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("local")}
            className={`${activeTabClass} ${
              activeTab === "local"
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-transparent text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <FaDesktop className="w-3.5 h-3.5" /> Local Sync
            </span>
          </button>
        </div>

        <div className="p-4 sm:p-5">
          {activeTab === "manual" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/40 p-4 text-sm text-gray-600 dark:text-gray-400">
                Create and manage manual accounts. Tag each account as <strong>Personal</strong> or <strong>Prop Firm</strong>. For Prop Firm accounts, set Phase, Profit Target, Max Loss, and Daily Max Loss.
              </div>
              <ManageAccounts hideAddButton />
            </div>
          )}

          {activeTab === "metaapi" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-900/10 p-4 text-sm text-emerald-700 dark:text-emerald-300">
                <div className="flex items-start gap-2">
                  <FaLink className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-semibold">Explicit MetaAPI workflow</p>
                    <p className="mt-1">
                      Creating an MT5 account only provisions cloud linkage. Historical import/streaming begins when you click <strong>Sync</strong>.
                    </p>
                  </div>
                </div>
              </div>
              <MT5AccountsList hideAddButton />
            </div>
          )}

          {activeTab === "local" && (
            <LocalMT5SyncPage />
          )}
        </div>
      </section>

      <AccountCreationFlowModal
        isOpen={isCreationModalOpen}
        isSubmitting={isCreatingAccount}
        onClose={() => setIsCreationModalOpen(false)}
        onCreateManual={handleCreateManual}
        onCreateMt5={handleCreateMt5}
      />
    </div>
  );
}
