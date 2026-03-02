import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  Brain, 
  Smartphone, 
  MousePointer2, 
  Zap, 
  RefreshCw, 
  ShieldCheck, 
  ChevronRight,
  Info,
  History,
  Wind,
  Moon,
  Coffee
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  ResponsiveContainer, 
  YAxis, 
  XAxis, 
  Tooltip 
} from 'recharts';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useStressDetection } from './hooks/useStressDetection';
import { analyzeStress } from './services/gemini';
import { StressReport, SensorData } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const { sensorData, requestPermission, permissionGranted } = useStressDetection();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<StressReport | null>(null);
  const [history, setHistory] = useState<StressReport[]>([]);
  const [view, setView] = useState<'dashboard' | 'history' | 'onboarding'>('onboarding');

  // Real-time data for the chart
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>([]);

  useEffect(() => {
    if (permissionGranted) {
      setView('dashboard');
    }
  }, [permissionGranted]);

  useEffect(() => {
    if (view === 'dashboard') {
      const now = new Date();
      const timeStr = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      // Calculate a "live intensity" metric for the chart
      const intensity = (sensorData.shakeIntensity * 0.4) + (sensorData.scrollIrregularity * 0.3) + (sensorData.tapFrequency * 0.1);
      
      setChartData(prev => [...prev.slice(-19), { time: timeStr, value: Math.min(10, intensity) }]);
    }
  }, [sensorData, view]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const newReport = await analyzeStress(sensorData);
      setReport(newReport);
      setHistory(prev => [newReport, ...prev]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const stressLevelColor = useMemo(() => {
    if (!report) return 'text-zinc-500';
    if (report.score < 3) return 'text-emerald-500';
    if (report.score < 6) return 'text-amber-500';
    return 'text-rose-500';
  }, [report]);

  const stressLevelBg = useMemo(() => {
    if (!report) return 'bg-zinc-100';
    if (report.score < 3) return 'bg-emerald-50';
    if (report.score < 6) return 'bg-amber-50';
    return 'bg-rose-50';
  }, [report]);

  if (view === 'onboarding') {
    return (
      <div className="min-h-screen bg-[#f5f5f0] flex flex-col items-center justify-center p-6 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-xl shadow-emerald-200">
              <Activity className="text-white w-10 h-10" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-4xl font-serif font-medium text-zinc-900">ZenPulse</h1>
            <p className="text-zinc-600 leading-relaxed">
              Understand your body's silent signals. We use your device's sensors to detect subtle patterns of stress in your digital behavior.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 py-8">
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-center gap-2">
              <Smartphone className="w-6 h-6 text-emerald-600" />
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Motion</span>
            </div>
            <div className="p-4 bg-white rounded-2xl shadow-sm border border-zinc-100 flex flex-col items-center gap-2">
              <MousePointer2 className="w-6 h-6 text-emerald-600" />
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Interaction</span>
            </div>
          </div>

          <button
            onClick={requestPermission}
            className="w-full py-4 bg-zinc-900 text-white rounded-full font-medium shadow-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 group"
          >
            Enable Monitoring
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <p className="text-xs text-zinc-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Your data stays on your device.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-zinc-900 font-sans pb-24">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#f5f5f0]/80 backdrop-blur-md border-b border-zinc-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Activity className="text-white w-5 h-5" />
          </div>
          <span className="font-serif text-xl font-medium tracking-tight">ZenPulse</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setView(view === 'dashboard' ? 'history' : 'dashboard')}
            className="p-2 rounded-full hover:bg-zinc-200 transition-colors"
          >
            {view === 'dashboard' ? <History className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-6 space-y-6">
        <AnimatePresence mode="wait">
          {view === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              {/* Real-time Monitor Card */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Live Indicators</h2>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[10px] font-mono text-emerald-600 uppercase">Monitoring</span>
                  </div>
                </div>
                
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#059669" 
                        strokeWidth={2} 
                        dot={false} 
                        isAnimationActive={false}
                      />
                      <YAxis hide domain={[0, 10]} />
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-zinc-900 text-white text-[10px] px-2 py-1 rounded">
                                {payload[0].value.toFixed(1)} Intensity
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 bg-zinc-50 rounded-2xl flex flex-col items-center justify-center gap-1">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span className="text-[10px] font-mono font-medium">{sensorData.shakeIntensity.toFixed(1)}</span>
                    <span className="text-[8px] text-zinc-400 uppercase">Shake</span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl flex flex-col items-center justify-center gap-1">
                    <RefreshCw className="w-4 h-4 text-blue-500" />
                    <span className="text-[10px] font-mono font-medium">{sensorData.scrollIrregularity.toFixed(1)}</span>
                    <span className="text-[8px] text-zinc-400 uppercase">Scroll</span>
                  </div>
                  <div className="p-3 bg-zinc-50 rounded-2xl flex flex-col items-center justify-center gap-1">
                    <MousePointer2 className="w-4 h-4 text-rose-500" />
                    <span className="text-[10px] font-mono font-medium">{sensorData.tapFrequency}</span>
                    <span className="text-[8px] text-zinc-400 uppercase">Taps/m</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-zinc-50 flex items-center justify-between text-[10px] text-zinc-400 uppercase tracking-widest font-medium">
                  <div className="flex items-center gap-1">
                    <Smartphone className="w-3 h-3" />
                    <span>Daily Usage</span>
                  </div>
                  <span className="text-zinc-900 font-mono">{Math.floor(sensorData.usageTimeMinutes)}m {Math.floor((sensorData.usageTimeMinutes % 1) * 60)}s</span>
                </div>
              </div>

              {/* Analysis Trigger */}
              <div className="space-y-4">
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={cn(
                    "w-full py-6 rounded-3xl font-medium shadow-xl transition-all flex flex-col items-center justify-center gap-2",
                    isAnalyzing ? "bg-zinc-100 text-zinc-400" : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95"
                  )}
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span>Analyzing Patterns...</span>
                    </>
                  ) : (
                    <>
                      <Brain className="w-8 h-8" />
                      <span className="text-lg">Check Stress Level</span>
                    </>
                  )}
                </button>
              </div>

              {/* Result Card */}
              {report && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("rounded-3xl p-6 border shadow-sm space-y-6", stressLevelBg, "border-zinc-100")}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold uppercase tracking-widest text-zinc-400">Current Score</h3>
                      <div className={cn("text-5xl font-serif font-bold", stressLevelColor)}>
                        {report.score}<span className="text-xl text-zinc-400 font-sans font-normal">/10</span>
                      </div>
                    </div>
                    <div className={cn("px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider", stressLevelBg, stressLevelColor, "border border-current opacity-80")}>
                      {report.score < 3 ? 'Calm' : report.score < 6 ? 'Alert' : 'Stressed'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-zinc-500 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      Analysis
                    </h4>
                    <p className="text-sm text-zinc-700 leading-relaxed italic">
                      "{report.analysis}"
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase text-zinc-500">Recommended Actions</h4>
                    <div className="space-y-2">
                      {report.suggestions.map((suggestion, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-white/50 rounded-2xl border border-white/20">
                          <div className="mt-1">
                            {i === 0 ? <Wind className="w-4 h-4 text-emerald-600" /> : 
                             i === 1 ? <Moon className="w-4 h-4 text-indigo-600" /> : 
                             <Coffee className="w-4 h-4 text-amber-600" />}
                          </div>
                          <p className="text-sm text-zinc-800">{suggestion}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              <h2 className="text-2xl font-serif font-medium px-2">History</h2>
              {history.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto">
                    <History className="w-8 h-8 text-zinc-300" />
                  </div>
                  <p className="text-zinc-400 text-sm italic">No records yet. Start monitoring to see your progress.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((item, i) => (
                    <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold",
                          item.score < 3 ? "bg-emerald-50 text-emerald-600" : 
                          item.score < 6 ? "bg-amber-50 text-amber-600" : 
                          "bg-rose-50 text-rose-600"
                        )}>
                          {item.score}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900">
                            {item.score < 3 ? 'Calm' : item.score < 6 ? 'Moderate' : 'High Stress'}
                          </p>
                          <p className="text-[10px] text-zinc-400">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-zinc-300" />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-zinc-200 px-8 py-4 flex items-center justify-around">
        <button 
          onClick={() => setView('dashboard')}
          className={cn("flex flex-col items-center gap-1", view === 'dashboard' ? "text-emerald-600" : "text-zinc-400")}
        >
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-widest">Monitor</span>
        </button>
        <button 
          onClick={() => setView('history')}
          className={cn("flex flex-col items-center gap-1", view === 'history' ? "text-emerald-600" : "text-zinc-400")}
        >
          <History className="w-6 h-6" />
          <span className="text-[10px] font-medium uppercase tracking-widest">History</span>
        </button>
      </nav>
    </div>
  );
}
