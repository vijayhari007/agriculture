import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);
  const [crops, setCrops] = useState([]);
  const [trendFilter, setTrendFilter] = useState(() => {
    // restore from localStorage if present
    try {
      const saved = JSON.parse(localStorage.getItem('trendFilter') || '{}');
      return { crop: saved.crop || 'wheat', state: saved.state || '', district: saved.district || '', days: saved.days || 30 };
    } catch (_) {
      return { crop: 'wheat', state: '', district: '', days: 30 };
    }
  });
  const [trendSeries, setTrendSeries] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  const exportTrendsCSV = () => {
    if (!trendSeries || !trendSeries.series?.length) return;
    const unit = trendSeries.unit || 'INR/qtl';
    const header = ['date','min','avg','max','unit','crop','state','district'];
    const rows = trendSeries.series.map(p => [
      p.date,
      p.min,
      p.avg,
      p.max,
      unit,
      trendSeries.crop,
      trendSeries.state,
      trendSeries.district || ''
    ]);
    const csv = [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `market_trends_${trendSeries.crop}_${trendSeries.state}${trendSeries.district?('_'+trendSeries.district):''}_${trendSeries.days}d.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // preload states and crops for filters
    (async () => {
      try {
        const [sres, cres] = await Promise.all([
          axios.get('http://localhost:5000/api/locations/states'),
          axios.get('http://localhost:5000/api/crops')
        ]);
        if (sres.data.success) setStatesList(sres.data.states || []);
        setCrops(cres.data.crops || []);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Load districts for selected state, and persist filter
  useEffect(() => {
    (async () => {
      if (!trendFilter.state) { setDistrictsList([]); return; }
      try {
        const res = await axios.get('http://localhost:5000/api/locations/districts', { params: { state: trendFilter.state } });
        if (res.data.success) setDistrictsList(res.data.districts || []);
      } catch (e) { setDistrictsList([]); }
    })();
    try { localStorage.setItem('trendFilter', JSON.stringify(trendFilter)); } catch (_) {}
  }, [trendFilter.state]);

  useEffect(() => {
    const loadTrend = async () => {
      if (!trendFilter.state || !trendFilter.crop) return;
      setTrendLoading(true);
      setTrendSeries(null);
      try {
        const res = await axios.get('http://localhost:5000/api/market-prices/history', {
          params: { crop: trendFilter.crop, state: trendFilter.state, district: trendFilter.district || undefined, days: trendFilter.days || 30 }
        });
        if (res.data.success) setTrendSeries(res.data);
      } catch (e) {
        // ignore
      } finally {
        setTrendLoading(false);
      }
    };
    loadTrend();
  }, [trendFilter]);

  const yieldData = {
    labels: ['Rice', 'Wheat', 'Corn', 'Soybean', 'Cotton', 'Tomato', 'Potato', 'Sugarcane'],
    datasets: [
      {
        label: 'Avg Yield (tons/ha)',
        data: [4.5, 3.2, 8.5, 2.8, 2.2, 25, 22, 70],
        backgroundColor: 'rgba(34, 197, 94, 0.6)'
      }
    ]
  };

  const nutrientDeficiencyData = {
    labels: ['Nitrogen', 'Phosphorus', 'Potassium', 'pH'],
    datasets: [
      {
        label: 'Deficiency Incidence',
        data: [48, 32, 28, 18],
        backgroundColor: [
          'rgba(239, 68, 68, 0.7)',
          'rgba(234, 179, 8, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(168, 85, 247, 0.7)'
        ],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Visual insights to support data-driven farming decisions.</p>
        </div>

        {loading ? (
          <div className="card text-center">Loading...</div>
        ) : (
          <div className="space-y-8">
            {/* Top Stats */}
            {stats && (
              <div className="grid md:grid-cols-4 gap-4">
                <div className="card text-center">
                  <div className="text-3xl font-bold text-primary-600">{stats.farmers_helped.toLocaleString()}</div>
                  <div className="text-gray-600">Farmers Helped</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-primary-600">{stats.total_crops_supported}</div>
                  <div className="text-gray-600">Crops Supported</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-primary-600">{stats.recommendation_accuracy}</div>
                  <div className="text-gray-600">Recommendation Accuracy</div>
                </div>
                <div className="card text-center">
                  <div className="text-3xl font-bold text-primary-600">{stats.avg_yield_improvement}</div>
                  <div className="text-gray-600">Yield Improvement</div>
                </div>
              </div>
            )}

            {/* Charts */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="card lg:col-span-2">
                <h2 className="text-lg font-semibold mb-4">Average Crop Yields</h2>
                <Bar
                  data={yieldData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'top' } },
                    scales: { y: { beginAtZero: true } }
                  }}
                />
              </div>

              <div className="card">
                <h2 className="text-lg font-semibold mb-4">Common Deficiencies</h2>
                <Doughnut
                  data={nutrientDeficiencyData}
                  options={{
                    responsive: true,
                    plugins: { legend: { position: 'bottom' } }
                  }}
                />
              </div>
            </div>

            {/* Market Price Trends */}
            <div className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
                <h2 className="text-lg font-semibold">Market Price Trends (Last 30 Days)</h2>
                <div className="grid md:grid-cols-5 gap-3 w-full md:w-auto">
                  <div>
                    <label className="label">Crop</label>
                    <select
                      className="input-field"
                      value={trendFilter.crop}
                      onChange={(e) => setTrendFilter(prev => ({ ...prev, crop: e.target.value }))}
                    >
                      <option value="">Select crop</option>
                      {crops.map(c => (
                        <option key={c.value} value={c.value}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">State</label>
                    <select
                      className="input-field"
                      value={trendFilter.state}
                      onChange={(e) => setTrendFilter(prev => ({ ...prev, state: e.target.value, district: '' }))}
                    >
                      <option value="">Select state</option>
                      {statesList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">District</label>
                    <select
                      className="input-field"
                      value={trendFilter.district}
                      onChange={(e) => setTrendFilter(prev => ({ ...prev, district: e.target.value }))}
                    >
                      <option value="">All</option>
                      {districtsList.map(d => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div className="hidden md:block"></div>
                  <div>
                    <label className="label">Days</label>
                    <select
                      className="input-field"
                      value={trendFilter.days || 30}
                      onChange={(e) => setTrendFilter(prev => ({ ...prev, days: Number(e.target.value) }))}
                    >
                      <option value={30}>30</option>
                      <option value={60}>60</option>
                      <option value={90}>90</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button className="btn-secondary w-full" onClick={exportTrendsCSV} disabled={!trendSeries || trendLoading}>Download CSV</button>
                  </div>
                </div>
              </div>
              {!trendFilter.state ? (
                <div className="text-gray-500 text-sm">Select a state to load trends.</div>
              ) : trendLoading ? (
                <div className="text-gray-500 text-sm">Loading trends...</div>
              ) : trendSeries ? (
                <Line
                  data={{
                    labels: trendSeries.series.map(p => p.date),
                    datasets: [
                      {
                        label: 'Min',
                        data: trendSeries.series.map(p => p.min),
                        borderColor: 'rgba(59, 130, 246, 1)',
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        tension: 0.2,
                        pointRadius: 2,
                      },
                      {
                        label: 'Avg',
                        data: trendSeries.series.map(p => p.avg),
                        borderColor: 'rgba(34, 197, 94, 1)',
                        backgroundColor: 'rgba(34, 197, 94, 0.2)',
                        tension: 0.2,
                        pointRadius: 2,
                      },
                      {
                        label: 'Max',
                        data: trendSeries.series.map(p => p.max),
                        borderColor: 'rgba(239, 68, 68, 1)',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        tension: 0.2,
                        pointRadius: 2,
                      },
                    ]
                  }}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const unit = (trendSeries && trendSeries.unit) ? trendSeries.unit : 'INR/qtl';
                            const label = context.dataset.label || '';
                            const val = context.parsed.y;
                            return `${label}: ${val} ${unit}`;
                          }
                        }
                      }
                    },
                    scales: { y: { beginAtZero: false } }
                  }}
                />
              ) : (
                <div className="text-gray-500 text-sm">No data.</div>
              )}
              {trendSeries && (
                <div className="text-xs text-gray-500 mt-2">
                  Note: Prices shown are in {trendSeries.unit || 'INR/qtl'} for {trendSeries.crop} in {trendSeries.state}{trendSeries.district ? (', ' + trendSeries.district) : ''}.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
