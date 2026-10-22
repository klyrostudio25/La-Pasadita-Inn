/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Clock,
  Layers,
  ChefHat,
  Database,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { OrderRecord, MenuItemRecord, supabase, isConfigured } from '../lib/supabase';

interface AdminAnalyticsProps {
  orders: OrderRecord[];
  menuItems: MenuItemRecord[];
  primaryAccentColor?: string;
  onOrdersChange: (updatedOrders: OrderRecord[]) => void;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({
  orders,
  menuItems,
  primaryAccentColor = '#DDA843',
  onOrdersChange
}) => {
  // Timeframe: 7, 14, or 30 days (Default: 30 days)
  const [timeframeDays, setTimeframeDays] = useState<7 | 14 | 30>(30);
  const [isGeneratingHistory, setIsGeneratingHistory] = useState(false);
  const [historyToast, setHistoryToast] = useState<string | null>(null);
  const [selectedChartType, setSelectedChartType] = useState<'combined' | 'revenue' | 'volume'>('combined');

  // Generate continuous daily buckets for the selected timeframe
  const dailyData = useMemo(() => {
    const buckets: {
      dateKey: string;
      label: string;
      weekday: string;
      revenue: number;
      ordersCount: number;
      takeoutCount: number;
      dineInCount: number;
      completedCount: number;
      pendingCount: number;
      avgTicket: number;
    }[] = [];

    const now = new Date();

    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateKey = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });

      buckets.push({
        dateKey,
        label,
        weekday,
        revenue: 0,
        ordersCount: 0,
        takeoutCount: 0,
        dineInCount: 0,
        completedCount: 0,
        pendingCount: 0,
        avgTicket: 0
      });
    }

    // Map each order to its respective date bucket
    orders.forEach((ord) => {
      if (!ord.created_at) return;
      const ordDateKey = new Date(ord.created_at).toISOString().slice(0, 10);
      const bucket = buckets.find((b) => b.dateKey === ordDateKey);

      if (bucket) {
        bucket.ordersCount += 1;
        if (ord.status !== 'cancelled') {
          bucket.revenue += Number(ord.total_amount) || 0;
        }

        const typeLower = (ord.order_type || '').toLowerCase();
        if (typeLower.includes('dine')) {
          bucket.dineInCount += 1;
        } else {
          bucket.takeoutCount += 1;
        }

        if (ord.status === 'completed' || ord.status === 'ready') {
          bucket.completedCount += 1;
        } else {
          bucket.pendingCount += 1;
        }
      }
    });

    // Calculate rounded values
    buckets.forEach((b) => {
      b.revenue = Number(b.revenue.toFixed(2));
      b.avgTicket = b.ordersCount > 0 ? Number((b.revenue / b.ordersCount).toFixed(2)) : 0;
    });

    return buckets;
  }, [orders, timeframeDays]);

  // Overall Aggregate KPIs for the selected timeframe
  const aggregateKpis = useMemo(() => {
    const totalRevenue = dailyData.reduce((sum, d) => sum + d.revenue, 0);
    const totalOrders = dailyData.reduce((sum, d) => sum + d.ordersCount, 0);
    const totalTakeout = dailyData.reduce((sum, d) => sum + d.takeoutCount, 0);
    const totalDineIn = dailyData.reduce((sum, d) => sum + d.dineInCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const dailyAverageRevenue = totalRevenue / timeframeDays;

    let peakRevenueDay = dailyData[0] || { label: 'N/A', revenue: 0, ordersCount: 0 };
    let peakVolumeDay = dailyData[0] || { label: 'N/A', revenue: 0, ordersCount: 0 };

    dailyData.forEach((d) => {
      if (d.revenue > peakRevenueDay.revenue) peakRevenueDay = d;
      if (d.ordersCount > peakVolumeDay.ordersCount) peakVolumeDay = d;
    });

    return {
      totalRevenue,
      totalOrders,
      totalTakeout,
      totalDineIn,
      avgOrderValue,
      dailyAverageRevenue,
      peakRevenueDay,
      peakVolumeDay
    };
  }, [dailyData, timeframeDays]);

  // Day of Week Distribution (Mon through Sun)
  const dayOfWeekData = useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const distribution = days.map((day) => ({
      day,
      revenue: 0,
      orders: 0
    }));

    dailyData.forEach((d) => {
      const target = distribution.find((item) => item.day === d.weekday);
      if (target) {
        target.revenue += d.revenue;
        target.orders += d.ordersCount;
      }
    });

    return distribution.map((item) => ({
      ...item,
      revenue: Number(item.revenue.toFixed(2))
    }));
  }, [dailyData]);

  // Seed Realistic 30-Day Historical Orders to test full trends
  const handleSeedHistoricalOrders = async () => {
    setIsGeneratingHistory(true);
    const sampleCustomerNames = [
      'Sofia Martinez', 'Carlos Ramirez', 'Elena Vance', 'Mateo Gonzalez',
      'Jessica Miller', 'David Chen', 'Rosa Hernandez', 'Lucas Romero',
      'Maya Larson', 'Julian Rivera', 'Camila Ortiz', 'Antonio Cruz'
    ];

    const targetDays = 30;
    const generatedOrders: OrderRecord[] = [];
    const generatedOrderItems: any[] = [];
    const now = new Date();

    const sampleDishes = menuItems.length > 0 ? menuItems : [
      { id: '1', name: 'Crispy Chile Rellenos', price: 15.19 },
      { id: '2', name: 'Sizzling Fajitas Skillet', price: 17.99 },
      { id: '3', name: 'Homemade Tamales Plate', price: 14.99 },
      { id: '4', name: 'Smothered Green Chile Burrito', price: 14.99 },
      { id: '5', name: 'Street Tacos Platter', price: 14.50 },
      { id: '6', name: 'Pozole Rojo Tradicional', price: 14.99 }
    ];

    for (let dayOffset = targetDays - 1; dayOffset >= 0; dayOffset--) {
      const orderDate = new Date(now.getTime() - dayOffset * 86400000);
      const isWeekend = orderDate.getDay() === 5 || orderDate.getDay() === 6; // Fri / Sat rush
      const isSunday = orderDate.getDay() === 0; // Usually closed or light
      const ordersForDay = isSunday ? 1 : isWeekend ? Math.floor(4 + Math.random() * 4) : Math.floor(2 + Math.random() * 3);

      for (let j = 0; j < ordersForDay; j++) {
        const orderId = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `hist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const randomName = sampleCustomerNames[Math.floor(Math.random() * sampleCustomerNames.length)];
        const randomPhone = `(303) ${Math.floor(200 + Math.random() * 700)}-${Math.floor(1000 + Math.random() * 9000)}`;
        const orderHour = 11 + Math.floor(Math.random() * 8); // 11 AM - 7 PM
        const orderMinute = Math.floor(Math.random() * 60);
        orderDate.setHours(orderHour, orderMinute, 0, 0);

        const dish1 = sampleDishes[Math.floor(Math.random() * sampleDishes.length)];
        const dish2 = sampleDishes[Math.floor(Math.random() * sampleDishes.length)];
        const qty1 = Math.floor(1 + Math.random() * 2);
        const qty2 = Math.random() > 0.4 ? 1 : 0;

        const subtotal = (dish1.price * qty1) + (qty2 ? dish2.price * qty2 : 0);
        const totalWithTax = Number((subtotal * 1.0881).toFixed(2));

        const newOrd: OrderRecord = {
          id: orderId,
          customer_name: randomName,
          customer_phone: randomPhone,
          order_type: Math.random() > 0.35 ? 'Takeout' : 'Dine-In Pickup',
          total_amount: totalWithTax,
          status: dayOffset > 0 ? 'completed' : Math.random() > 0.5 ? 'ready' : 'preparing',
          notes: Math.random() > 0.6 ? 'Denver pork green chile on the side' : null,
          created_at: orderDate.toISOString(),
          order_items: [
            {
              id: `item-${orderId}-1`,
              order_id: orderId,
              menu_item_id: dish1.id,
              item_name: dish1.name,
              quantity: qty1,
              unit_price: dish1.price
            }
          ]
        };

        if (qty2) {
          newOrd.order_items?.push({
            id: `item-${orderId}-2`,
            order_id: orderId,
            menu_item_id: dish2.id,
            item_name: dish2.name,
            quantity: qty2,
            unit_price: dish2.price
          });
        }

        generatedOrders.push(newOrd);
      }
    }

    // Merge into local state
    const merged = [...generatedOrders, ...orders];
    onOrdersChange(merged);

    // If Supabase is connected, batch insert into database
    if (supabase && isConfigured) {
      try {
        const payloadOrders = generatedOrders.map((o) => ({
          id: o.id,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          order_type: o.order_type,
          total_amount: o.total_amount,
          status: o.status,
          notes: o.notes,
          created_at: o.created_at
        }));

        await supabase.from('orders').upsert(payloadOrders);
      } catch (err: any) {
        console.warn('Supabase historical batch note:', err.message);
      }
    }

    setIsGeneratingHistory(false);
    setHistoryToast(`Successfully generated ${generatedOrders.length} realistic historical orders across 30 days!`);
    setTimeout(() => setHistoryToast(null), 4000);
  };

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 rounded-xl bg-[#121318] border border-[#22242D] shadow-2xl text-xs space-y-1.5 min-w-[180px]">
          <div className="font-display font-extrabold text-white flex items-center justify-between border-b border-[#22242D] pb-1">
            <span>{data.label} ({data.weekday})</span>
            <span className="text-[10px] text-[#8E92A0] font-mono">{data.dateKey}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1 text-[#DDA843]">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Revenue:</span>
            </span>
            <span className="font-mono font-bold text-white text-sm">
              ${data.revenue.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1 text-[#38BDF8]">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Order Tickets:</span>
            </span>
            <span className="font-mono font-bold text-white">
              {data.ordersCount} tickets
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-400 text-[11px] pt-1 border-t border-[#22242D]">
            <span>Avg Ticket:</span>
            <span className="font-mono text-[#DDA843]">${data.avgTicket.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-[#8E92A0]">
            <span>Takeout: {data.takeoutCount}</span>
            <span>Dine-In: {data.dineInCount}</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 text-[#F1F2F6]">
      
      {/* Toast Notification */}
      {historyToast && (
        <div className="p-3 rounded-xl bg-[#121318] border border-[#DDA843]/50 text-[#DDA843] text-xs font-bold flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{historyToast}</span>
          </div>
          <button
            onClick={() => setHistoryToast(null)}
            className="text-[#8E92A0] hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* TOP ANALYTICS TOOLBAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#121318] border border-[#22242D] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: primaryAccentColor }}
            />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#DDA843]">
              Supabase Orders Analytics
            </span>
          </div>
          <h2 className="font-display font-black text-xl sm:text-2xl text-white">
            Order Volume Trends & Revenue Intelligence
          </h2>
          <p className="text-xs text-[#8E92A0] mt-0.5">
            Visualizing daily incoming order tickets and gross earnings from the Supabase <code>orders</code> table.
          </p>
        </div>

        {/* Timeframe & Action Controls */}
        <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto">
          {/* Timeframe Selector */}
          <div className="flex items-center p-1 rounded-xl bg-[#181A20] border border-[#22242D] text-xs font-bold">
            {([
              { days: 7, label: 'Last 7D' },
              { days: 14, label: 'Last 14D' },
              { days: 30, label: 'Last 30D' }
            ] as const).map(({ days, label }) => (
              <button
                key={days}
                onClick={() => setTimeframeDays(days)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  timeframeDays === days
                    ? 'bg-[#DDA843] text-black shadow'
                    : 'text-[#9A9EAB] hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Seed Data Button (if testing or limited order count) */}
          <button
            onClick={handleSeedHistoricalOrders}
            disabled={isGeneratingHistory}
            className="px-3.5 py-2 rounded-xl bg-[#181A20] hover:bg-[#20232B] border border-[#22242D] text-[#DDA843] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Populate 30 days of realistic orders to test visualizations"
          >
            {isGeneratingHistory ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{isGeneratingHistory ? 'Generating...' : 'Seed 30D Data'}</span>
          </button>
        </div>
      </div>

      {/* KPI METRICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Metric 1: Total Gross Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#8E92A0]">
            <span className="font-mono uppercase tracking-wider text-[11px]">Gross Revenue ({timeframeDays}D)</span>
            <div className="w-7 h-7 rounded-lg bg-[#181A20] border border-[#22242D] flex items-center justify-center text-[#DDA843]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            ${aggregateKpis.totalRevenue.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#8E92A0] flex items-center gap-1 pt-1">
            <span className="text-[#DDA843] font-bold">
              ${aggregateKpis.dailyAverageRevenue.toFixed(2)}
            </span>
            <span>avg / day</span>
          </div>
        </div>

        {/* Metric 2: Total Order Volume */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#8E92A0]">
            <span className="font-mono uppercase tracking-wider text-[11px]">Order Volume ({timeframeDays}D)</span>
            <div className="w-7 h-7 rounded-lg bg-[#181A20] border border-[#22242D] flex items-center justify-center text-[#38BDF8]">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            {aggregateKpis.totalOrders}
            <span className="text-xs font-normal text-[#8E92A0] ml-1.5">tickets</span>
          </div>
          <div className="text-[11px] text-[#8E92A0] flex items-center gap-1 pt-1">
            <span className="text-[#38BDF8] font-bold">
              {(aggregateKpis.totalOrders / timeframeDays).toFixed(1)}
            </span>
            <span>orders / day</span>
          </div>
        </div>

        {/* Metric 3: Average Order Value (AOV) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#8E92A0]">
            <span className="font-mono uppercase tracking-wider text-[11px]">Average Order Value (AOV)</span>
            <div className="w-7 h-7 rounded-lg bg-[#181A20] border border-[#22242D] flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-2xl sm:text-3xl text-white">
            ${aggregateKpis.avgOrderValue.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#8E92A0] flex items-center gap-2 pt-1">
            <span>Takeout: <strong className="text-white">{aggregateKpis.totalTakeout}</strong></span>
            <span>·</span>
            <span>Dine-In: <strong className="text-white">{aggregateKpis.totalDineIn}</strong></span>
          </div>
        </div>

        {/* Metric 4: Peak Revenue & Volume Day */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#121318] border border-[#22242D] space-y-1 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-[#8E92A0]">
            <span className="font-mono uppercase tracking-wider text-[11px]">Peak Sales Day</span>
            <div className="w-7 h-7 rounded-lg bg-[#181A20] border border-[#22242D] flex items-center justify-center text-amber-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="font-display font-black text-xl sm:text-2xl text-white truncate">
            {aggregateKpis.peakRevenueDay.label}
          </div>
          <div className="text-[11px] text-[#8E92A0] pt-1 flex items-center justify-between">
            <span className="text-[#DDA843] font-mono font-bold">
              ${aggregateKpis.peakRevenueDay.revenue.toFixed(2)}
            </span>
            <span>({aggregateKpis.peakRevenueDay.ordersCount} tickets)</span>
          </div>
        </div>

      </div>

      {/* PRIMARY RECHARTS VISUALIZATION: DUAL AXIS REVENUE & ORDER VOLUME */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#121318] border border-[#22242D] space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#22242D]">
          <div>
            <h3 className="font-display font-black text-lg text-white flex items-center gap-2">
              <span>Daily Order Volume & Revenue Trend ({timeframeDays} Days)</span>
            </h3>
            <p className="text-xs text-[#8E92A0]">
              Dual-axis trend line: Gross revenue in gold ($ USD) and total order tickets in cyan.
            </p>
          </div>

          {/* Chart Display Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#181A20] border border-[#22242D] text-xs font-bold">
            {(['combined', 'revenue', 'volume'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedChartType(type)}
                className={`px-3 py-1 rounded-lg capitalize transition-colors cursor-pointer ${
                  selectedChartType === type
                    ? 'bg-[#121318] text-white border border-[#22242D] shadow'
                    : 'text-[#8E92A0] hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* RECHARTS COMPOSED CHART */}
        <div className="h-72 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryAccentColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={primaryAccentColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#22242D" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="label"
                stroke="#6A6E7C"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#22242D' }}
                interval={timeframeDays === 30 ? 2 : 0}
              />

              {/* Left Y Axis: Revenue ($ USD) */}
              {(selectedChartType === 'combined' || selectedChartType === 'revenue') && (
                <YAxis
                  yAxisId="left"
                  stroke="#6A6E7C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#22242D' }}
                  tickFormatter={(val) => `$${val}`}
                />
              )}

              {/* Right Y Axis: Order Volume (Tickets) */}
              {(selectedChartType === 'combined' || selectedChartType === 'volume') && (
                <YAxis
                  yAxisId={selectedChartType === 'combined' ? 'right' : 'left'}
                  orientation={selectedChartType === 'combined' ? 'right' : 'left'}
                  stroke="#38BDF8"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#22242D' }}
                  tickFormatter={(val) => `${val}`}
                />
              )}

              <Tooltip content={<CustomTooltip />} />

              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
              />

              {/* Revenue Area */}
              {(selectedChartType === 'combined' || selectedChartType === 'revenue') && (
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue ($ USD)"
                  stroke={primaryAccentColor}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                />
              )}

              {/* Order Volume Line */}
              {(selectedChartType === 'combined' || selectedChartType === 'volume') && (
                <Line
                  yAxisId={selectedChartType === 'combined' ? 'right' : 'left'}
                  type="monotone"
                  dataKey="ordersCount"
                  name="Order Volume (Tickets)"
                  stroke="#38BDF8"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#38BDF8' }}
                  activeDot={{ r: 6, fill: '#38BDF8' }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SECONDARY CHARTS GRID: ORDER TYPE STACK & DAY-OF-WEEK PERFORMANCE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 2: Order Type Breakdown (Takeout vs Dine-in) */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#121318] border border-[#22242D] space-y-3">
          <div>
            <h3 className="font-display font-extrabold text-base text-white">
              Daily Order Type Distribution
            </h3>
            <p className="text-xs text-[#8E92A0]">
              Takeout pickups versus Dine-In orders placed per day over the selected timeframe.
            </p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="#22242D" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  stroke="#6A6E7C"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: '#22242D' }}
                  interval={timeframeDays === 30 ? 3 : 0}
                />
                <YAxis
                  stroke="#6A6E7C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#22242D' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  verticalAlign="top"
                  height={32}
                  wrapperStyle={{ fontSize: '11px' }}
                />
                <Bar dataKey="takeoutCount" name="Takeout" fill={primaryAccentColor} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="dineInCount" name="Dine-In Pickup" fill="#38BDF8" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Day of Week Performance */}
        <div className="p-5 sm:p-6 rounded-3xl bg-[#121318] border border-[#22242D] space-y-3">
          <div>
            <h3 className="font-display font-extrabold text-base text-white">
              Day-of-Week Revenue Performance
            </h3>
            <p className="text-xs text-[#8E92A0]">
              Aggregated gross sales by day of the week to identify peak comal kitchen shifts.
            </p>
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dayOfWeekData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#22242D" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="#6A6E7C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#22242D' }}
                />
                <YAxis
                  stroke="#6A6E7C"
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#22242D' }}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`$${Number(val).toFixed(2)}`, 'Total Revenue']}
                  contentStyle={{ backgroundColor: '#121318', borderColor: '#22242D', borderRadius: '12px' }}
                />
                <Bar dataKey="revenue" name="Total Revenue ($)" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* DAILY ORDERS LOG TABLE (30 DAYS) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-[#121318] border border-[#22242D] space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-display font-extrabold text-base text-white">
              Daily Breakdown History ({timeframeDays} Days)
            </h3>
            <p className="text-xs text-[#8E92A0]">
              Day-by-day ticket count, gross sales, and average ticket size.
            </p>
          </div>
          <span className="text-xs font-mono text-[#DDA843]">
            {dailyData.filter(d => d.ordersCount > 0).length} Active Trading Days
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-[#22242D]">
          <table className="w-full text-left text-xs text-[#9A9EAB]">
            <thead className="bg-[#181A20] text-white uppercase text-[10px] tracking-wider border-b border-[#22242D]">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Day</th>
                <th className="py-3 px-4">Order Volume</th>
                <th className="py-3 px-4">Gross Revenue</th>
                <th className="py-3 px-4">Avg Ticket Size</th>
                <th className="py-3 px-4">Takeout vs Dine-In</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#22242D]">
              {dailyData.slice().reverse().map((day) => (
                <tr key={day.dateKey} className="hover:bg-[#181A20]/60 transition-colors">
                  <td className="py-2.5 px-4 font-mono font-bold text-white">
                    {day.label}
                  </td>
                  <td className="py-2.5 px-4 text-[#8E92A0]">
                    {day.weekday}
                  </td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                        day.ordersCount > 0
                          ? 'bg-blue-500/20 text-[#38BDF8] border border-blue-500/30'
                          : 'bg-[#181A20] text-[#6A6E7C]'
                      }`}
                    >
                      {day.ordersCount} tickets
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-white">
                    ${day.revenue.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[#DDA843]">
                    ${day.avgTicket.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-4 text-[11px] text-[#8E92A0]">
                    <span>{day.takeoutCount} Takeout</span>
                    <span className="mx-1.5">·</span>
                    <span>{day.dineInCount} Dine-In</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
