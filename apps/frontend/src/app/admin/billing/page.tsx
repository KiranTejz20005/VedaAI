'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { 
  CreditCard, 
  School, 
  Layers, 
  FileCheck2, 
  FilePlus2, 
  Check, 
  DollarSign,
  TrendingUp,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

interface Institution {
  id: string;
  name: string;
}

interface Subscription {
  id: string;
  institutionId: string;
  plan: string;
  status: string;
  expiresAt: string;
  stripeCustomerId: string | null;
  stripeSubId: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  createdAt: string;
}

interface UsageLimits {
  plan: string;
  status: string;
  usage: {
    generations: number;
    storageMb: number;
    tokens: number;
  };
  limits: {
    generations: number;
    storageMb: number;
    tokens: number;
  };
}

export default function BillingAdmin() {
  const { user } = useAuthStore();
  const [insts, setInsts] = useState<Institution[]>([]);
  const [selectedInstId, setSelectedInstId] = useState('');
  const [sub, setSub] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageLimits | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceAmount, setInvoiceAmount] = useState('49.00');
  const [invoiceStatus, setInvoiceStatus] = useState('PAID');

  useEffect(() => {
    loadInstitutions();
  }, []);

  useEffect(() => {
    if (selectedInstId) {
      loadBillingDetails(selectedInstId);
    }
  }, [selectedInstId]);

  const loadInstitutions = async () => {
    try {
      const res = await api.get('/admin/institutions');
      if (res.data?.success) {
        setInsts(res.data.data);
        if (res.data.data.length > 0) {
          // Default to the user's own institution if they are not super admin, or first one
          const defaultId = user?.institutionId || res.data.data[0].id;
          setSelectedInstId(defaultId);
        }
      }
    } catch (err) {
      toast.error('Failed to load institutions');
    }
  };

  const loadBillingDetails = async (institutionId: string) => {
    try {
      setLoading(true);
      const [subRes, usageRes] = await Promise.all([
        api.get(`/admin/billing/subscriptions/${institutionId}`),
        api.get(`/admin/billing/usage/${institutionId}`),
      ]);

      if (subRes.data?.success) {
        setSub(subRes.data.data);
        // Load invoices for subscription
        const invRes = await api.get(`/admin/billing/invoices/${subRes.data.data.id}`);
        if (invRes.data?.success) setInvoices(invRes.data.data);
      }
      if (usageRes.data?.success) {
        setUsage(usageRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load subscription statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlan = async (planName: string) => {
    if (!sub) return;
    if (!confirm(`Upgrade/Downgrade institution plan to ${planName}?`)) return;

    try {
      const res = await api.put(`/admin/billing/subscriptions/${selectedInstId}`, {
        plan: planName,
        status: 'ACTIVE',
      });

      if (res.data?.success) {
        toast.success(`Plan updated to ${planName} successfully!`);
        loadBillingDetails(selectedInstId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Plan update failed');
    }
  };

  const handleCancelSub = async () => {
    if (!sub) return;
    if (!confirm('Are you sure you want to mark this subscription as CANCELED?')) return;

    try {
      const res = await api.put(`/admin/billing/subscriptions/${selectedInstId}`, {
        status: 'CANCELED',
      });

      if (res.data?.success) {
        toast.success('Subscription successfully marked as canceled.');
        loadBillingDetails(selectedInstId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel');
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sub) return;

    try {
      const res = await api.post('/admin/billing/invoices', {
        subscriptionId: sub.id,
        amount: parseFloat(invoiceAmount),
        currency: 'USD',
        status: invoiceStatus,
        pdfUrl: 'https://vedaai-test.onrender.com/mock-invoice.pdf',
      });

      if (res.data?.success) {
        toast.success('Mock invoice registered successfully!');
        setShowInvoiceModal(false);
        setInvoiceAmount('49.00');
        // reload
        loadBillingDetails(selectedInstId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Invoice creation failed');
    }
  };

  const getPercentage = (value: number, limit: number) => {
    return Math.min(100, (value / limit) * 100);
  };

  const PLANS = [
    { name: 'FREE', price: '0', desc: 'Ideal for trial accounts and testing evaluations.' },
    { name: 'STARTER', price: '49', desc: 'Standard classroom features for teachers.' },
    { name: 'PRO', price: '149', desc: 'Enterprise integrations and high volume AI support.' },
    { name: 'ENTERPRISE', price: '499', desc: 'Dedicated cluster limits and custom setups.' },
  ];

  return (
    <div className="space-y-6">
      {/* Title + Institution select */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Billing & Subscriptions</h2>
          <p className="text-gray-500 text-xs md:text-sm">Manage pricing subscriptions, track AI usage volumes, and view billing invoices.</p>
        </div>
        
        {user?.role === 'SUPER_ADMIN' && (
          <div className="flex items-center gap-2">
            <School size={16} className="text-gray-400" />
            <select
              value={selectedInstId}
              onChange={(e) => setSelectedInstId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-blue-500 shadow-sm"
            >
              {insts.map(inst => (
                <option key={inst.id} value={inst.id}>{inst.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Usage + Invoice column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Usage panel */}
            {usage && (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Usage Progress</h3>
                  <p className="text-gray-400 text-[10px]">Resource boundaries mapped to the current <strong>{usage.plan}</strong> subscription plan.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Paper generations progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500">Exams Generated</span>
                      <span className="text-gray-800 font-bold">{usage.usage.generations} / {usage.limits.generations >= 9999 ? 'Unlimited' : usage.limits.generations}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full" 
                        style={{ width: `${getPercentage(usage.usage.generations, usage.limits.generations)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Storage MB */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500">Storage Size</span>
                      <span className="text-gray-800 font-bold">{usage.usage.storageMb} MB / {(usage.limits.storageMb / 1024).toFixed(0)} GB</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-purple-600 h-full rounded-full" 
                        style={{ width: `${getPercentage(usage.usage.storageMb, usage.limits.storageMb)}%` }} 
                      />
                    </div>
                  </div>

                  {/* Token counter */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500">LLM Prompt Tokens</span>
                      <span className="text-gray-800 font-bold">{(usage.usage.tokens / 1000).toFixed(0)}K / {(usage.limits.tokens / 1000000).toFixed(0)}M</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full" 
                        style={{ width: `${getPercentage(usage.usage.tokens, usage.limits.tokens)}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Invoices List */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Invoice History</h3>
                  <p className="text-gray-400 text-[10px]">Payment records and receipts pdf.</p>
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={() => setShowInvoiceModal(true)}
                    className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-bold text-[10px] py-1 px-3 rounded-lg flex items-center gap-1 transition-all"
                  >
                    <FilePlus2 size={12} /> Add Invoice
                  </button>
                )}
              </div>

              {invoices.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">No invoices generated yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-semibold uppercase tracking-wider">
                        <th className="py-2.5">Invoice ID</th>
                        <th className="py-2.5">Amount</th>
                        <th className="py-2.5">Status</th>
                        <th className="py-2.5">Date</th>
                        <th className="py-2.5 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {invoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 font-semibold text-gray-800 truncate max-w-[120px]">{inv.id}</td>
                          <td className="py-3 font-bold text-gray-800">
                            ${inv.amount.toFixed(2)} {inv.currency}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border ${
                              inv.status === 'PAID' 
                                ? 'bg-green-50 text-green-700 border-green-200' 
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-400 font-semibold">
                            {new Date(inv.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-right">
                            {inv.pdfUrl && (
                              <a
                                href={inv.pdfUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-bold hover:underline"
                              >
                                PDF Receipt
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>

          {/* Pricing Plans Column */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-1 space-y-6">
            <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Subscription Plan</h3>
                <span className="text-[10px] text-gray-500 font-semibold block mt-0.5">Active Plan: <strong className="text-blue-600">{sub?.plan}</strong></span>
              </div>
              {sub?.status === 'ACTIVE' && (
                <button
                  onClick={handleCancelSub}
                  className="text-red-500 hover:text-red-700 text-[10px] font-bold"
                >
                  Cancel Plan
                </button>
              )}
            </div>

            <div className="space-y-4">
              {PLANS.map(p => {
                const isActive = sub?.plan === p.name;
                return (
                  <div 
                    key={p.name} 
                    className={`p-4 rounded-xl border transition-all ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-400' 
                        : 'border-gray-100 hover:border-gray-200 bg-gray-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <strong className="text-xs font-extrabold text-gray-900 block">{p.name}</strong>
                      {isActive && (
                        <div className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center">
                          <Check size={12} />
                        </div>
                      )}
                    </div>
                    <span className="text-xl font-bold text-gray-900 block mt-1">
                      ${p.price} <span className="text-[10px] text-gray-400 font-normal">/ month</span>
                    </span>
                    <p className="text-[10px] text-gray-400 mt-1 leading-normal">{p.desc}</p>
                    
                    {!isActive && user?.role === 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleUpdatePlan(p.name)}
                        className="mt-3 w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-[10px] py-1.5 rounded-lg transition-colors"
                      >
                        Change to {p.name}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Register Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-6 relative">
            <button onClick={() => setShowInvoiceModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Register Mock Invoice</h3>
            
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Invoice Amount ($)*</label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-gray-400">
                    <DollarSign size={14} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 uppercase mb-1">Payment Status *</label>
                <select
                  required
                  value={invoiceStatus}
                  onChange={(e) => setInvoiceStatus(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                >
                  <option value="PAID">Paid</option>
                  <option value="UNPAID">Unpaid / Open</option>
                  <option value="VOID">Void</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-sm text-xs mt-2"
              >
                Register Invoice Receipt
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
