import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { translations } from '../../lib/i18n';
import { hapticFeedback } from '../../lib/haptics';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Wallet,
  Users,
  Settings,
  ArrowUpRight,
  TrendingUp,
  Search,
  Filter,
  Copy,
  Check,
  Download,
  AlertTriangle,
  Lock,
  Unlock,
  RefreshCw,
  Eye,
  EyeOff,
  UserCheck,
  UserX,
  CreditCard,
  PlusCircle,
  MinusCircle,
  FileText,
  Mail,
  KeyRound,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Submission, WithdrawRequest, UserProfile, LevelConfig } from '../../types';

export const AdminView: React.FC = () => {
  const {
    language,
    user,
    profile,
    isAdmin,
    adminUnlocked,
    unlockAdmin,
    lockAdmin,
    allSubmissions,
    allWithdrawRequests,
    allUsers,
    levels,
    reviewShifts,
    minWithdraw,
    commissionPercent,
    signupBonusUser,
    signupBonusReferrer,
    maintenanceMode,
    isWithdrawDisabled,
    adminApproveSubmission,
    adminRejectSubmission,
    adminApproveWithdraw,
    adminRejectWithdraw,
    adminUpdateUser,
    adminUpdateSettings,
    copyText,
    addNotification,
    setActiveTab,
  } = useApp();

  const t = translations[language];

  // Internal Navigation
  const [adminTab, setAdminTab] = useState<'overview' | 'submissions' | 'withdrawals' | 'users' | 'settings'>('overview');

  // Master key unlock state
  const [unlockPin, setUnlockPin] = useState<string>('');
  const [unlockError, setUnlockError] = useState<string>('');

  // Submissions Tab Filter States
  const [subStatusFilter, setSubStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [subSearchQuery, setSubSearchQuery] = useState<string>('');
  const [expandedSubKey, setExpandedSubKey] = useState<string | null>(null);
  const [processingSubKey, setProcessingSubKey] = useState<string | null>(null);
  const [rejectionModalSub, setRejectionModalSub] = useState<Submission | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('Incorrect password / 2FA active');

  // Withdrawals Tab Filter States
  const [wdStatusFilter, setWdStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [wdMethodFilter, setWdMethodFilter] = useState<string>('all');
  const [wdSearchQuery, setWdSearchQuery] = useState<string>('');
  const [trxIdInputs, setTrxIdInputs] = useState<Record<string, string>>({});
  const [processingWdKey, setProcessingWdKey] = useState<string | null>(null);

  // Users Tab Filter States
  const [userSearchQuery, setUserSearchQuery] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'seller' | 'blocked'>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [balanceAdjustmentAmount, setBalanceAdjustmentAmount] = useState<string>('');
  const [balanceAdjustmentType, setBalanceAdjustmentType] = useState<'add' | 'deduct'>('add');
  const [adjustmentNote, setAdjustmentNote] = useState<string>('');

  // Settings Tab State
  const [settingsMinWithdraw, setSettingsMinWithdraw] = useState<number>(minWithdraw);
  const [settingsCommission, setSettingsCommission] = useState<number>(commissionPercent);
  const [settingsBonusUser, setSettingsBonusUser] = useState<number>(signupBonusUser);
  const [settingsBonusReferrer, setSettingsBonusReferrer] = useState<number>(signupBonusReferrer);
  const [settingsMaintenance, setSettingsMaintenance] = useState<boolean>(maintenanceMode);
  const [settingsWithdrawDisabled, setSettingsWithdrawDisabled] = useState<boolean>(isWithdrawDisabled);
  const [editableLevels, setEditableLevels] = useState<LevelConfig[]>(levels);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);

  // Summary Metrics Computation
  const metrics = useMemo(() => {
    const totalUsersCount = allUsers.length;
    const pendingSubs = allSubmissions.filter((s) => s.status === 'pending');
    const approvedSubs = allSubmissions.filter((s) => s.status === 'approved');
    const rejectedSubs = allSubmissions.filter((s) => s.status === 'rejected');

    const totalApprovedGmailsCount = approvedSubs.reduce((sum, s) => sum + (s.count || 0), 0);
    const totalApprovedValue = approvedSubs.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);

    const pendingWds = allWithdrawRequests.filter((w) => w.status === 'pending');
    const approvedWds = allWithdrawRequests.filter((w) => w.status === 'approved');
    const totalPendingWdAmount = pendingWds.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
    const totalPaidWdAmount = approvedWds.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    return {
      totalUsersCount,
      pendingSubsCount: pendingSubs.length,
      approvedSubsCount: approvedSubs.length,
      rejectedSubsCount: rejectedSubs.length,
      totalApprovedGmailsCount,
      totalApprovedValue,
      pendingWdsCount: pendingWds.length,
      totalPendingWdAmount,
      totalPaidWdAmount,
    };
  }, [allUsers, allSubmissions, allWithdrawRequests]);

  // Filtered Submissions
  const filteredSubmissions = useMemo(() => {
    return allSubmissions.filter((sub) => {
      if (subStatusFilter !== 'all' && sub.status !== subStatusFilter) return false;
      if (subSearchQuery.trim()) {
        const q = subSearchQuery.toLowerCase().trim();
        const matchUser = (sub.username || '').toLowerCase().includes(q);
        const matchKey = (sub.key || '').toLowerCase().includes(q);
        const matchEmail = (sub.gmails || []).some((g) => g.email.toLowerCase().includes(q));
        if (!matchUser && !matchKey && !matchEmail) return false;
      }
      return true;
    });
  }, [allSubmissions, subStatusFilter, subSearchQuery]);

  // Filtered Withdrawals
  const filteredWithdrawals = useMemo(() => {
    return allWithdrawRequests.filter((wd) => {
      if (wdStatusFilter !== 'all' && wd.status !== wdStatusFilter) return false;
      if (wdMethodFilter !== 'all' && wd.method !== wdMethodFilter) return false;
      if (wdSearchQuery.trim()) {
        const q = wdSearchQuery.toLowerCase().trim();
        const matchUser = (wd.username || '').toLowerCase().includes(q);
        const matchNumber = (wd.paymentNumber || '').toLowerCase().includes(q);
        if (!matchUser && !matchNumber) return false;
      }
      return true;
    });
  }, [allWithdrawRequests, wdStatusFilter, wdMethodFilter, wdSearchQuery]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return allUsers.filter((u) => {
      if (userRoleFilter === 'admin' && u.role !== 'admin') return false;
      if (userRoleFilter === 'seller' && !u.isTopSeller) return false;
      if (userRoleFilter === 'blocked' && !u.is_blocked) return false;
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase().trim();
        const matchName = (u.username || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchPhone = (u.phone || '').toLowerCase().includes(q);
        const matchRef = (u.referralCode || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchRef) return false;
      }
      return true;
    });
  }, [allUsers, userRoleFilter, userSearchQuery]);

  // Handle Master PIN Unlock
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unlockPin.trim()) return;
    const ok = unlockAdmin(unlockPin);
    if (ok) {
      hapticFeedback.heavy();
      setUnlockPin('');
      setUnlockError('');
    } else {
      hapticFeedback.light();
      setUnlockError(language === 'bn' ? 'ভুল এডমিন পিন/পাসওয়ার্ড!' : 'Invalid Admin PIN/Password!');
    }
  };

  // If not admin, show secure unlock gate
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="rounded-3xl bg-white border border-slate-200 shadow-xl p-6 text-center space-y-5">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-rose-500 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-indigo-200">
            <Lock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">
              {language === 'bn' ? 'এডমিন অ্যাক্সেস প্রয়োজন' : 'Admin Authorization Required'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'bn'
                ? 'এডমিন কন্ট্রোল প্যানেল ব্যবহারের জন্য আপনার মাস্টার পাসওয়ার্ড বা সিক্রেট পিন দিন।'
                : 'Enter your designated master secret key to unlock full management controls.'}
            </p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-3">
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                placeholder={language === 'bn' ? 'এডমিন পিন দিন (উদা: admin7788)' : 'Admin Key (e.g. admin7788)'}
                value={unlockPin}
                onChange={(e) => setUnlockPin(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                autoFocus
              />
            </div>

            {unlockError && (
              <div className="text-xs font-bold text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100 flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{unlockError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-lg shadow-indigo-200 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Unlock className="w-4 h-4" />
              <span>{language === 'bn' ? 'প্যানেল আনলক করুন' : 'Unlock Admin Panel'}</span>
            </button>
          </form>

          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={() => setActiveTab('home')}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← {language === 'bn' ? 'ইউজার হোমে ফিরে যান' : 'Back to Home'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Handle Approve Submission
  const handleApproveSub = async (sub: Submission) => {
    if (!sub.key) return;
    hapticFeedback.medium();
    setProcessingSubKey(sub.key);
    await adminApproveSubmission(sub.key, sub);
    setProcessingSubKey(null);
  };

  // Handle Reject Submission
  const handleConfirmRejectSub = async () => {
    if (!rejectionModalSub || !rejectionModalSub.key) return;
    hapticFeedback.heavy();
    setProcessingSubKey(rejectionModalSub.key);
    await adminRejectSubmission(rejectionModalSub.key, rejectionModalSub, rejectionReason);
    setProcessingSubKey(null);
    setRejectionModalSub(null);
  };

  // Handle Export Batch
  const handleExportFiltered = () => {
    hapticFeedback.light();
    let exportText = '';
    filteredSubmissions.forEach((sub) => {
      (sub.gmails || []).forEach((g) => {
        exportText += `${g.email}:${g.password}${g.recoveryEmail ? `:${g.recoveryEmail}` : ''}\n`;
      });
    });

    if (!exportText.trim()) {
      addNotification('No Data 📄', 'No Gmails found to export under current filter.', 'warning');
      return;
    }

    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mail_factory_gmails_${subStatusFilter}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    addNotification('Export Complete 📥', `Exported Gmails to text file.`, 'success');
  };

  // Handle Approve Withdrawal
  const handleApproveWithdrawal = async (wd: WithdrawRequest) => {
    if (!wd.key) return;
    hapticFeedback.medium();
    setProcessingWdKey(wd.key);
    const trx = trxIdInputs[wd.key] || 'AUTO-PROCESSED';
    await adminApproveWithdraw(wd.key, wd, trx);
    setProcessingWdKey(null);
  };

  // Handle Reject Withdrawal
  const handleRejectWithdrawal = async (wd: WithdrawRequest) => {
    if (!wd.key) return;
    const reason = prompt(
      language === 'bn' ? 'বাতিল করার কারণ লিখুন (টাকা ইউজারের ব্যালেন্সে রিফান্ড হবে):' : 'Rejection reason (Amount will be refunded to user):',
      'Invalid account number / Name mismatch'
    );
    if (reason === null) return;
    hapticFeedback.heavy();
    setProcessingWdKey(wd.key);
    await adminRejectWithdraw(wd.key, wd, reason);
    setProcessingWdKey(null);
  };

  // Handle Balance Adjustment
  const handleSaveBalanceAdjustment = async () => {
    if (!selectedUserForEdit) return;
    const amount = Number(balanceAdjustmentAmount);
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    hapticFeedback.medium();
    const currentBal = Number(selectedUserForEdit.balance) || 0;
    const newBal =
      balanceAdjustmentType === 'add' ? currentBal + amount : Math.max(0, currentBal - amount);

    await adminUpdateUser(selectedUserForEdit.uid, {
      balance: newBal,
      admin_message: adjustmentNote ? `Balance update: ${adjustmentNote}` : undefined,
    });

    setSelectedUserForEdit(null);
    setBalanceAdjustmentAmount('');
    setAdjustmentNote('');
  };

  // Handle Save Settings
  const handleSaveAllSettings = async () => {
    hapticFeedback.heavy();
    setIsSavingSettings(true);

    const formattedLevels: Record<string, any> = {};
    editableLevels.forEach((l) => {
      formattedLevels[String(l.level)] = {
        req: l.approved,
        new_rate: l.rate,
        old_rate: l.old_rate,
        title: l.title,
        desc: l.perkDescription,
      };
    });

    await adminUpdateSettings({
      min_withdraw: Number(settingsMinWithdraw),
      commission_percent: Number(settingsCommission),
      signup_bonus_user: Number(settingsBonusUser),
      signup_bonus_referrer: Number(settingsBonusReferrer),
      maintenance_mode: settingsMaintenance,
      is_withdraw_disabled: settingsWithdrawDisabled,
      levels: formattedLevels,
    });

    setIsSavingSettings(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-5 space-y-5 pb-24 animate-fade-in">
      {/* Top Admin Header Bar */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/50">
              <Shield className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight">
                  {language === 'bn' ? 'এডমিন কমান্ড কন্ট্রোল' : 'Admin Command Console'}
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold border border-emerald-500/30">
                  SUPER ADMIN
                </span>
              </div>
              <p className="text-xs text-indigo-200">
                {user?.email || 'admin@mailfactory.com'} • Live Operations
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                hapticFeedback.light();
                setActiveTab('home');
              }}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'ইউজার ভিউ' : 'User View'}</span>
            </button>

            <button
              onClick={() => {
                hapticFeedback.heavy();
                lockAdmin();
              }}
              className="px-3 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Lock Admin Session"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'লক' : 'Lock'}</span>
            </button>
          </div>
        </div>

        {/* Quick Navigation Tabs */}
        <div className="grid grid-cols-5 gap-1.5 mt-5 pt-4 border-t border-white/10">
          {[
            { id: 'overview', label: language === 'bn' ? 'ওভারভিউ' : 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
            {
              id: 'submissions',
              label: language === 'bn' ? 'সাবমিশন' : 'Submissions',
              icon: <Mail className="w-4 h-4" />,
              badge: metrics.pendingSubsCount > 0 ? metrics.pendingSubsCount : undefined,
            },
            {
              id: 'withdrawals',
              label: language === 'bn' ? 'উত্তোলন' : 'Payouts',
              icon: <Wallet className="w-4 h-4" />,
              badge: metrics.pendingWdsCount > 0 ? metrics.pendingWdsCount : undefined,
            },
            { id: 'users', label: language === 'bn' ? 'ইউজার' : 'Users', icon: <Users className="w-4 h-4" /> },
            { id: 'settings', label: language === 'bn' ? 'সেটিংস' : 'Settings', icon: <Settings className="w-4 h-4" /> },
          ].map((tab) => {
            const isActive = adminTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  hapticFeedback.light();
                  setAdminTab(tab.id as any);
                }}
                className={`py-2.5 px-2 rounded-2xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1 relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-white/5 hover:bg-white/10 text-slate-300'
                }`}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-slate-900 animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OVERVIEW & KEY METRICS                                            */}
      {/* ========================================================================= */}
      {adminTab === 'overview' && (
        <div className="space-y-4">
          {/* Action Alerts */}
          {(metrics.pendingSubsCount > 0 || metrics.pendingWdsCount > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {metrics.pendingSubsCount > 0 && (
                <div
                  onClick={() => setAdminTab('submissions')}
                  className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-900 flex items-center justify-between cursor-pointer hover:bg-amber-500/15 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold">
                      {metrics.pendingSubsCount}
                    </div>
                    <div>
                      <h4 className="text-xs font-black">
                        {language === 'bn' ? 'পেন্ডিং জিমেইল রিভিউ বাকি' : 'Pending Gmail Audits'}
                      </h4>
                      <p className="text-[11px] text-amber-700">
                        {language === 'bn' ? 'ক্লিক করে রিভিউ ও অ্যাপ্রুভ করুন' : 'Click to review & approve batches'}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-amber-600" />
                </div>
              )}

              {metrics.pendingWdsCount > 0 && (
                <div
                  onClick={() => setAdminTab('withdrawals')}
                  className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-900 flex items-center justify-between cursor-pointer hover:bg-rose-500/15 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold">
                      ৳{metrics.totalPendingWdAmount}
                    </div>
                    <div>
                      <h4 className="text-xs font-black">
                        {metrics.pendingWdsCount} {language === 'bn' ? 'উইথড্র রিকোয়েস্ট পেন্ডিং' : 'Pending Payouts'}
                      </h4>
                      <p className="text-[11px] text-rose-700">
                        {language === 'bn' ? 'ক্লিক করে bKash/Nagad পেমেন্ট কনফার্ম করুন' : 'Click to send funds & approve'}
                      </p>
                    </div>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-rose-600" />
                </div>
              )}
            </div>
          )}

          {/* Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'bn' ? 'মোট ইউজার' : 'Total Users'}
              </span>
              <div className="text-2xl font-black text-slate-800">{metrics.totalUsersCount}</div>
              <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                <Users className="w-3 h-3" /> Registered
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'bn' ? 'অ্যাপ্রুভড জিমেইল' : 'Approved Gmails'}
              </span>
              <div className="text-2xl font-black text-indigo-700">{metrics.totalApprovedGmailsCount}</div>
              <span className="text-[10px] text-indigo-500 font-bold">
                ৳{metrics.totalApprovedValue.toFixed(2)} Vol
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'bn' ? 'পেন্ডিং উইথড্র' : 'Pending Payouts'}
              </span>
              <div className="text-2xl font-black text-amber-600">৳{metrics.totalPendingWdAmount}</div>
              <span className="text-[10px] text-amber-600 font-bold">
                {metrics.pendingWdsCount} requests waiting
              </span>
            </div>

            <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                {language === 'bn' ? 'মোট পেইড আউট' : 'Total Paid Out'}
              </span>
              <div className="text-2xl font-black text-emerald-600">৳{metrics.totalPaidWdAmount.toFixed(2)}</div>
              <span className="text-[10px] text-emerald-600 font-bold">
                Processed successfully
              </span>
            </div>
          </div>

          {/* Quick System Summary */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>{language === 'bn' ? 'সিস্টেম স্ট্যাটাস ও এক্সচেঞ্জ প্যারামিটার' : 'Live System Rules'}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Min Withdraw</span>
                <span className="font-black text-slate-800">৳{minWithdraw}</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Referral Comm.</span>
                <span className="font-black text-slate-800">{commissionPercent}%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Maintenance</span>
                <span className={`font-black ${maintenanceMode ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {maintenanceMode ? 'ACTIVE (PAUSED)' : 'OFF (LIVE)'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Withdrawals</span>
                <span className={`font-black ${isWithdrawDisabled ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isWithdrawDisabled ? 'DISABLED' : 'ENABLED'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SUBMISSIONS & GMAIL AUDIT                                         */}
      {/* ========================================================================= */}
      {adminTab === 'submissions' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              {/* Search */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'ইউজার, ইমেইল বা আইডি খুঁজুন...' : 'Search username, email, ID...'}
                  value={subSearchQuery}
                  onChange={(e) => setSubSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Status Filter Chips */}
              <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      hapticFeedback.light();
                      setSubStatusFilter(st);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                      subStatusFilter === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'pending' && `⏳ Pending (${metrics.pendingSubsCount})`}
                    {st === 'approved' && `✅ Approved`}
                    {st === 'rejected' && `❌ Rejected`}
                    {st === 'all' && `All (${allSubmissions.length})`}
                  </button>
                ))}

                <button
                  onClick={handleExportFiltered}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1 shadow-sm ml-auto sm:ml-2"
                  title="Export to text"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Submissions List */}
          <div className="space-y-3">
            {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-bold">
                <Mail className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-600" />
                <p>{language === 'bn' ? 'কোনো সাবমিশন ডাটা পাওয়া যায়নি।' : 'No submissions found matching criteria.'}</p>
              </div>
            ) : (
              filteredSubmissions.map((sub) => {
                const isExpanded = expandedSubKey === sub.key;
                const isProcessing = processingSubKey === sub.key;

                return (
                  <div
                    key={sub.key || sub.id}
                    className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all"
                  >
                    {/* Batch Header */}
                    <div className="p-4 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm ${
                            sub.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-700'
                              : sub.status === 'rejected'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {sub.status === 'approved' ? '✓' : sub.status === 'rejected' ? '✕' : '⏳'}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 text-sm">{sub.username}</span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-mono font-black uppercase">
                              {sub.gmailsType || 'NEW'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              #{sub.key?.slice(-6) || ''}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {new Date(sub.submittedAt).toLocaleString()} • {sub.count} Gmails • Rate: ৳{sub.rate}/pc
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-base font-black text-indigo-700">৳{sub.totalAmount.toFixed(2)}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Credit</span>
                        </div>

                        {sub.status === 'pending' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              disabled={isProcessing}
                              onClick={() => handleApproveSub(sub)}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow active:scale-95 transition-all flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{language === 'bn' ? 'অ্যাপ্রুভ' : 'Approve'}</span>
                            </button>

                            <button
                              disabled={isProcessing}
                              onClick={() => {
                                setRejectionModalSub(sub);
                                setRejectionReason('Incorrect password / 2FA active');
                              }}
                              className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black active:scale-95 transition-all"
                            >
                              {language === 'bn' ? 'বাতিল' : 'Reject'}
                            </button>
                          </div>
                        )}

                        <button
                          onClick={() => setExpandedSubKey(isExpanded ? null : sub.key || null)}
                          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs"
                          title="Toggle Credentials View"
                        >
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Credentials Expand View */}
                    {isExpanded && (
                      <div className="p-4 space-y-2 bg-white">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs font-bold text-slate-500">
                          <span>Gmail Credentials List ({sub.gmails?.length || 0})</span>
                          <button
                            onClick={() => {
                              const batchText = (sub.gmails || [])
                                .map((g) => `${g.email}:${g.password}${g.recoveryEmail ? `:${g.recoveryEmail}` : ''}`)
                                .join('\n');
                              copyText(batchText, 'Batch copied to clipboard');
                            }}
                            className="text-indigo-600 hover:text-indigo-800 text-[11px] font-black flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            <span>Copy Batch (User:Pass)</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(sub.gmails || []).map((g, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono gap-2"
                            >
                              <div className="space-y-0.5">
                                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">#{idx + 1}</span>
                                  <span>{g.email}</span>
                                </div>
                                <div className="text-slate-500 text-[11px] flex items-center gap-2">
                                  <span>Pass: <strong className="text-indigo-900">{g.password}</strong></span>
                                  {g.recoveryEmail && <span>• Recov: {g.recoveryEmail}</span>}
                                </div>
                              </div>

                              <button
                                onClick={() => copyText(`${g.email}:${g.password}`, 'Credential copied')}
                                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 text-[10px] font-sans font-bold flex items-center gap-1 self-start sm:self-auto"
                              >
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: WITHDRAWAL & PAYOUT MANAGEMENT                                    */}
      {/* ========================================================================= */}
      {adminTab === 'withdrawals' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'ইউজার বা অ্যাকাউন্ট নম্বর খুঁজুন...' : 'Search user, account number...'}
                  value={wdSearchQuery}
                  onChange={(e) => setWdSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(['pending', 'approved', 'rejected', 'all'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => {
                      hapticFeedback.light();
                      setWdStatusFilter(st);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                      wdStatusFilter === st
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st === 'pending' && `⏳ Pending (${metrics.pendingWdsCount})`}
                    {st === 'approved' && `✅ Paid`}
                    {st === 'rejected' && `❌ Rejected`}
                    {st === 'all' && `All (${allWithdrawRequests.length})`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Withdrawals List */}
          <div className="space-y-3">
            {filteredWithdrawals.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs font-bold">
                <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-600" />
                <p>{language === 'bn' ? 'কোনো উইথড্র রিকোয়েস্ট পাওয়া যায়নি।' : 'No withdrawal requests found.'}</p>
              </div>
            ) : (
              filteredWithdrawals.map((wd) => {
                const isProcessing = processingWdKey === wd.key;

                return (
                  <div
                    key={wd.key || wd.id}
                    className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-bold text-indigo-700 text-sm">
                          {(wd.paymentMethod || 'W').charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 text-sm">{wd.username}</span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                              {wd.paymentMethod}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                wd.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : wd.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {wd.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-mono font-bold text-indigo-900 bg-indigo-50/70 px-2 py-0.5 rounded-lg border border-indigo-100">
                              {wd.paymentNumber}
                            </span>
                            <button
                              onClick={() => copyText(wd.paymentNumber, 'Account number copied')}
                              className="text-slate-400 hover:text-slate-700"
                              title="Copy number"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[10px] text-slate-400">
                              • {new Date(wd.requestedAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xl font-black text-indigo-700">৳{Number(wd.amount).toFixed(2)}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Payout Amount</span>
                      </div>
                    </div>

                    {/* Pending Actions */}
                    {wd.status === 'pending' && (
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Transaction TrxID (e.g. 9J87K65...)"
                          value={trxIdInputs[wd.key || ''] || ''}
                          onChange={(e) =>
                            setTrxIdInputs((prev) => ({ ...prev, [wd.key || '']: e.target.value }))
                          }
                          className="w-full sm:flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <button
                            disabled={isProcessing}
                            onClick={() => handleApproveWithdrawal(wd)}
                            className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow active:scale-95 transition-all flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'bn' ? 'পেইড মার্ক করুন' : 'Mark as Paid'}</span>
                          </button>

                          <button
                            disabled={isProcessing}
                            onClick={() => handleRejectWithdrawal(wd)}
                            className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black active:scale-95 transition-all"
                          >
                            {language === 'bn' ? 'বাতিল ও রিফান্ড' : 'Reject & Refund'}
                          </button>
                        </div>
                      </div>
                    )}

                    {wd.status === 'approved' && wd.transactionNote && (
                      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                        <span className="font-bold text-emerald-700">TrxID:</span>
                        <span>{wd.transactionNote}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: USERS DATABASE & WALLET MANAGEMENT                                */}
      {/* ========================================================================= */}
      {adminTab === 'users' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={language === 'bn' ? 'ইউজার, ইমেইল বা রেফার কোড খুঁজুন...' : 'Search user, email, referral code...'}
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
                {(['all', 'admin', 'seller', 'blocked'] as const).map((rf) => (
                  <button
                    key={rf}
                    onClick={() => {
                      hapticFeedback.light();
                      setUserRoleFilter(rf);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold capitalize transition-all ${
                      userRoleFilter === rf
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {rf === 'all' && `All (${allUsers.length})`}
                    {rf === 'admin' && 'Admins'}
                    {rf === 'seller' && 'VIP Sellers'}
                    {rf === 'blocked' && 'Blocked'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User Cards */}
          <div className="space-y-3">
            {filteredUsers.map((u) => (
              <div
                key={u.uid}
                className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow">
                    {(u.username || 'U').charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 text-sm">{u.username}</span>
                      {u.role === 'admin' && (
                        <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-black">
                          ADMIN
                        </span>
                      )}
                      {u.isTopSeller && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                          TOP SELLER
                        </span>
                      )}
                      {u.is_blocked && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-black">
                          BLOCKED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {u.email} • Ref: <strong>{u.referralCode}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-600">
                      ৳{(Number(u.balance) || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block">
                      Hold: ৳{(Number(u.hold) || 0).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedUserForEdit(u);
                        setBalanceAdjustmentAmount('');
                        setAdjustmentNote('');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-black text-xs transition-all flex items-center gap-1"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{language === 'bn' ? 'ব্যালেন্স' : 'Balance'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        hapticFeedback.medium();
                        await adminUpdateUser(u.uid, {
                          is_blocked: !u.is_blocked,
                        });
                      }}
                      className={`p-1.5 rounded-xl border text-xs ${
                        u.is_blocked
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                      title={u.is_blocked ? 'Unblock User' : 'Block User'}
                    >
                      {u.is_blocked ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: GLOBAL SETTINGS & RATES CONTROL                                    */}
      {/* ========================================================================= */}
      {adminTab === 'settings' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>{language === 'bn' ? 'গ্লোবাল প্ল্যাটফর্ম সেটিংস' : 'Global Platform Rules'}</span>
              </h3>
              <button
                disabled={isSavingSettings}
                onClick={handleSaveAllSettings}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{isSavingSettings ? 'Saving...' : language === 'bn' ? 'সেভ করুন' : 'Save Changes'}</span>
              </button>
            </div>

            {/* General Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Minimum Withdrawal Limit (৳)
                </label>
                <input
                  type="number"
                  value={settingsMinWithdraw}
                  onChange={(e) => setSettingsMinWithdraw(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Referral Commission Rate (%)
                </label>
                <input
                  type="number"
                  value={settingsCommission}
                  onChange={(e) => setSettingsCommission(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  New User Signup Bonus (৳)
                </label>
                <input
                  type="number"
                  value={settingsBonusUser}
                  onChange={(e) => setSettingsBonusUser(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Referrer Signup Bonus (৳)
                </label>
                <input
                  type="number"
                  value={settingsBonusReferrer}
                  onChange={(e) => setSettingsBonusReferrer(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800">Maintenance Mode</h4>
                  <p className="text-[10px] text-slate-500">Temporarily pause new submissions</p>
                </div>
                <button
                  onClick={() => setSettingsMaintenance(!settingsMaintenance)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    settingsMaintenance ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settingsMaintenance ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-800">Disable Withdrawals</h4>
                  <p className="text-[10px] text-slate-500">Lock new payout requests</p>
                </div>
                <button
                  onClick={() => setSettingsWithdrawDisabled(!settingsWithdrawDisabled)}
                  className={`w-12 h-6 rounded-full p-1 transition-colors ${
                    settingsWithdrawDisabled ? 'bg-rose-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      settingsWithdrawDisabled ? 'translate-x-6' : ''
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Level Rates Matrix */}
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>{language === 'bn' ? 'লেভেল রেট ম্যাট্রিক্স কনফিগারেশন' : 'Level Rates Matrix Configuration'}</span>
            </h3>

            <div className="space-y-2.5">
              {editableLevels.map((lvl, idx) => (
                <div
                  key={lvl.level}
                  className="p-3 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs"
                >
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Level Title</span>
                    <input
                      type="text"
                      value={lvl.title || `Level ${lvl.level}`}
                      onChange={(e) => {
                        const copy = [...editableLevels];
                        copy[idx].title = e.target.value;
                        setEditableLevels(copy);
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Req. Approved</span>
                    <input
                      type="number"
                      value={lvl.approved}
                      onChange={(e) => {
                        const copy = [...editableLevels];
                        copy[idx].approved = Number(e.target.value);
                        setEditableLevels(copy);
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">New Gmail Rate (৳)</span>
                    <input
                      type="number"
                      value={lvl.rate}
                      onChange={(e) => {
                        const copy = [...editableLevels];
                        copy[idx].rate = Number(e.target.value);
                        setEditableLevels(copy);
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-indigo-700"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Old Gmail Rate (৳)</span>
                    <input
                      type="number"
                      value={lvl.old_rate}
                      onChange={(e) => {
                        const copy = [...editableLevels];
                        copy[idx].old_rate = Number(e.target.value);
                        setEditableLevels(copy);
                      }}
                      className="w-full px-2 py-1 rounded-lg bg-white border border-slate-200 font-bold text-indigo-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal for Submission */}
      {rejectionModalSub && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">
                  {language === 'bn' ? 'সাবমিশন বাতিল কনফার্মেশন' : 'Reject Submission'}
                </h3>
                <p className="text-xs text-slate-500">Batch #{rejectionModalSub.key?.slice(-6)}</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-600 block">Select Rejection Reason:</label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Incorrect password / 2FA active">Incorrect password / 2FA active</option>
                <option value="Duplicate Gmail already sold">Duplicate Gmail already sold</option>
                <option value="Invalid recovery email">Invalid recovery email</option>
                <option value="Disabled or suspended account">Disabled or suspended account</option>
                <option value="Format mismatch">Format mismatch</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setRejectionModalSub(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRejectSub}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow transition-all"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Balance Adjustment Modal */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl border border-slate-100 animate-scale-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Adjust Balance</h3>
                <p className="text-xs text-slate-500">{selectedUserForEdit.username} • Available: ৳{(Number(selectedUserForEdit.balance) || 0).toFixed(2)}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setBalanceAdjustmentType('add')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                    balanceAdjustmentType === 'add' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600'
                  }`}
                >
                  + Add Balance
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAdjustmentType('deduct')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
                    balanceAdjustmentType === 'deduct' ? 'bg-rose-600 text-white shadow' : 'text-slate-600'
                  }`}
                >
                  - Deduct Balance
                </button>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Amount (৳):</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={balanceAdjustmentAmount}
                  onChange={(e) => setBalanceAdjustmentAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">Reason / Note (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Manual payout or correction"
                  value={adjustmentNote}
                  onChange={(e) => setAdjustmentNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setSelectedUserForEdit(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveBalanceAdjustment}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow transition-all"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
