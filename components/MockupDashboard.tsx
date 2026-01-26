import {
    ArrowRight,
    Bell,
    Calendar,
    ChevronRight,
    Clock,
    Home,
    Search,
    Settings,
    SlidersHorizontal,
    Star,
    ThumbsUp,
    X
} from 'lucide-react';
import React from 'react';

export default function App() {
    // --- Off-Cycle State ---
    // Cycle is NOT active. 
    // User is preparing for the next cycle.

    const cycleData = {
        nextCycle: "Cycle 24-04",
        opensDate: "01 NOV",
        daysUntilOpen: 12,
        totalMarketSize: 1450,
        matchingBillets: 342, // Billets matching their rate/rank
    };

    const userStats = {
        discovered: 128,
        liked: 12,
        superLiked: 2,
        passed: 45
    };

    const leaveData = {
        balance: 24.5,
        pendingRequest: {
            dates: "12 - 18 OCT",
            status: "Pending Dept Head"
        }
    };

    // --- UI Components ---

    // 1. Status Section (Informational, not Urgent)
    const StatusSection = () => {
        return (
            <div className="flex flex-col gap-2 mb-3">
                <div className="bg-blue-50/80 backdrop-blur-sm border-l-2 border-blue-500 pl-3 pr-2 py-2.5 rounded-r-lg shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
                        <div>
                            <p className="text-blue-900 text-xs font-bold leading-none mb-0.5">Cycle Closed</p>
                            <p className="text-blue-700 text-[10px] leading-tight">
                                {cycleData.nextCycle} opens in <span className="font-bold">{cycleData.daysUntilOpen} days</span>.
                            </p>
                        </div>
                    </div>
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        Prep Mode
                    </span>
                </div>
            </div>
        );
    };

    // 2. Engagement Stats (Condensed)
    // Keeps track of their sorting progress
    const StatsSection = () => {
        return (
            <div className="bg-white rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 mb-3 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">My Shortlist</p>
                        <div className="flex items-baseline gap-1 mt-0.5">
                            <h4 className="text-xl font-bold text-slate-800 tracking-tight">{userStats.liked + userStats.superLiked}</h4>
                            <span className="text-[10px] text-slate-400 font-medium">Billets Saved</span>
                        </div>
                    </div>

                    {/* Mini Donut Chart Representation */}
                    <div className="w-8 h-8 rounded-full border-[3px] border-slate-50 border-r-emerald-500 border-t-emerald-500 flex items-center justify-center">
                        <span className="text-[9px] font-bold text-slate-400">14</span>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="flex-1 bg-rose-50 rounded-lg py-1.5 flex flex-col items-center justify-center border border-rose-100/50">
                        <Star className="w-3.5 h-3.5 text-rose-500 mb-0.5" fill="currentColor" />
                        <span className="text-[10px] font-bold text-rose-700 leading-none">{userStats.superLiked}</span>
                    </div>
                    <div className="flex-1 bg-blue-50 rounded-lg py-1.5 flex flex-col items-center justify-center border border-blue-100/50">
                        <ThumbsUp className="w-3.5 h-3.5 text-blue-500 mb-0.5" />
                        <span className="text-[10px] font-bold text-blue-700 leading-none">{userStats.liked}</span>
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-lg py-1.5 flex flex-col items-center justify-center border border-slate-200/50">
                        <X className="w-3.5 h-3.5 text-slate-500 mb-0.5" />
                        <span className="text-[10px] font-bold text-slate-600 leading-none">{userStats.passed}</span>
                    </div>
                </div>
            </div>
        );
    };

    // 3. Discovery Action (The Main Event)
    // Replaces "Top Recommendations" with "Discovery Tools"
    const DiscoverySection = () => {
        return (
            <div className="flex-1 flex flex-col mb-3 min-h-0 gap-3">

                {/* Primary Hero Card: Start Discovery */}
                <div className="flex-1 bg-slate-900 rounded-2xl p-5 text-white shadow-lg shadow-slate-200/50 relative overflow-hidden flex flex-col justify-between group cursor-pointer active:scale-[0.98] transition-all">
                    {/* Background Elements */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black z-0"></div>
                    {/* Abstract Map Grid */}
                    <div className="absolute inset-0 opacity-20 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:14px_14px]"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-xl font-bold leading-tight mb-1">Discovery Mode</h2>
                            <p className="text-slate-400 text-xs font-medium">Explore & sort available billets.</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <Search className="w-4 h-4 text-emerald-400" />
                        </div>
                    </div>

                    <div className="relative z-10 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="text-3xl font-bold text-white">{cycleData.matchingBillets}</span>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">New Matches</span>
                                <span className="text-[10px] text-slate-500">Since last login</span>
                            </div>
                        </div>

                        <button className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                            Start Exploring <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Secondary Actions: Preferences */}
                <div className="h-16 bg-white rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between active:scale-[0.99] transition-transform">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500">
                            <SlidersHorizontal className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-800">Job Preferences</p>
                            <p className="text-[10px] text-slate-400">Last updated 24 days ago</p>
                        </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>

            </div>
        );
    };

    // 4. Leave Section (Same as previous)
    const LeaveSection = () => {
        return (
            <div className="bg-white rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between relative overflow-hidden min-h-[60px]">
                {/* Removed Pending Logic for this demo to show "Clean" state if desired, keeping it consistent with request though */}
                <div className="absolute top-0 right-0 w-3 h-3 bg-amber-500 rounded-bl-lg z-10" />

                <div className="flex flex-col">
                    <p className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Leave Balance</p>
                    <div className="flex items-baseline gap-1">
                        <h4 className="text-xl font-bold text-slate-800 leading-none mt-0.5">{leaveData.balance}</h4>
                        <span className="text-[10px] text-slate-400">Days</span>
                    </div>
                </div>

                <div className="bg-amber-50 rounded-lg pl-3 pr-2 py-1.5 border border-amber-100 flex flex-col items-end">
                    <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[9px] font-bold text-amber-700 uppercase">Pending</span>
                        <Clock className="w-3 h-3 text-amber-600" />
                    </div>
                    <p className="text-[10px] text-amber-800 font-medium">{leaveData.pendingRequest.dates}</p>
                </div>
            </div>
        );
    };

    // --- Main Layout ---
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-200 font-sans p-4 sm:p-8">
            {/* Mobile Device Container - iPhone 14/15 Dimensions */}
            <div className="w-full max-w-[390px] h-[844px] bg-[#FAFAFA] rounded-[50px] shadow-2xl overflow-hidden relative border-[8px] border-slate-900 ring-4 ring-slate-900/10 flex flex-col">

                {/* iOS Dynamic Island / Notch Area */}
                <div className="absolute top-0 left-0 right-0 h-12 z-50 flex justify-center pt-2">
                    <div className="w-32 h-8 bg-black rounded-full pointer-events-none"></div>
                </div>

                {/* Content Area - Safe Area Padding */}
                <div className="flex-1 flex flex-col pt-12 px-5 pb-2">

                    {/* Header */}
                    <header className="flex justify-between items-center mb-4 mt-2">
                        <div>
                            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Welcome Back</p>
                            <h1 className="text-lg font-bold text-slate-900">PO2 Mitchell</h1>
                        </div>
                        <button className="w-9 h-9 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-600 relative active:bg-slate-50">
                            <Bell className="w-4 h-4" />
                            {/* Removed Red Dot to simulate "All caught up" */}
                        </button>
                    </header>

                    {/* Sections */}

                    <StatusSection />
                    <StatsSection />
                    <DiscoverySection />
                    <LeaveSection />

                </div>

                {/* Modern Floating-Style Bottom Bar */}
                <div className="h-[88px] relative z-20 px-4 pb-6 pt-2 bg-white/80 backdrop-blur-md border-t border-slate-200/50 flex items-center justify-around">
                    {/* Active Tab */}
                    <div className="flex flex-col items-center gap-1 text-blue-600 group cursor-pointer">
                        <div className="w-12 h-8 rounded-full bg-blue-50 flex items-center justify-center transition-all group-hover:bg-blue-100 group-active:scale-95">
                            <Home className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <span className="text-[9px] font-bold tracking-wide">Home</span>
                    </div>

                    {/* Inactive Tab */}
                    <div className="flex flex-col items-center gap-1 text-slate-400 group cursor-pointer hover:text-slate-600 transition-colors">
                        <div className="w-12 h-8 rounded-full flex items-center justify-center group-active:scale-95">
                            <Calendar className="w-5 h-5 stroke-2" />
                        </div>
                        <span className="text-[9px] font-medium tracking-wide">Schedule</span>
                    </div>

                    {/* Inactive Tab */}
                    <div className="flex flex-col items-center gap-1 text-slate-400 group cursor-pointer hover:text-slate-600 transition-colors">
                        <div className="w-12 h-8 rounded-full flex items-center justify-center group-active:scale-95">
                            <Settings className="w-5 h-5 stroke-2" />
                        </div>
                        <span className="text-[9px] font-medium tracking-wide">Settings</span>
                    </div>
                </div>

            </div>
        </div>
    );
}