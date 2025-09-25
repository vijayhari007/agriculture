import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useI18n } from '../i18n';

const Advisor = () => {
  const { t } = useI18n();

  // Lists
  const [crops, setCrops] = useState([]);
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  // Advisory
  const [advisoryInput, setAdvisoryInput] = useState({
    crop_type: '',
    location_query: '',
    district: '',
    state: '',
    language: 'en'
  });
  const [advisoryText, setAdvisoryText] = useState('');
  const [advisoryLoading, setAdvisoryLoading] = useState(false);
  const [advisoryAudioUrl, setAdvisoryAudioUrl] = useState('');


  // Pest detection
  const [pestImage, setPestImage] = useState(null);
  const [pestResult, setPestResult] = useState(null);
  const [pestLoading, setPestLoading] = useState(false);

  // Market
  const [marketQuery, setMarketQuery] = useState({ crop: 'wheat', state: 'Maharashtra' });
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  // Feedback
  const [feedback, setFeedback] = useState({ feature: 'advisory', rating: 5, comments: '' });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [cropsRes, statesRes] = await Promise.all([
          axios.get('http://localhost:5000/api/crops'),
          axios.get('http://localhost:5000/api/locations/states')
        ]);
        setCrops(cropsRes.data.crops || []);
        if (statesRes.data.success) setStatesList(statesRes.data.states || []);
      } catch (e) {
        // no-op
      }
    })();
  }, []);

  useEffect(() => {
    const state = advisoryInput.state || marketQuery.state;
    if (!state) { setDistrictsList([]); return; }
    (async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/locations/districts', { params: { state } });
        if (res.data.success) setDistrictsList(res.data.districts || []);
      } catch (e) { setDistrictsList([]); }
    })();
  }, [advisoryInput.state, marketQuery.state]);

  // Advisory
  const fetchAdvisory = async () => {
    if (!advisoryInput.crop_type) { toast.error('Select a crop'); return; }
    setAdvisoryLoading(true); setAdvisoryText(''); setAdvisoryAudioUrl('');
    try {
      const payload = { ...advisoryInput };
      const res = await axios.post('http://localhost:5000/api/advisory', payload);
      if (res.data.success) { setAdvisoryText(res.data.advisory || res.data.advisory_en || ''); toast.success('Advisory generated'); }
      else toast.error('Failed to get advisory');
    } catch (e) { toast.error('Server error while fetching advisory'); }
    finally { setAdvisoryLoading(false); }
  };

  const b64ToBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) byteNumbers[i] = slice.charCodeAt(i);
      const byteArray = new Uint8Array(byteNumbers); byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const speakAdvisory = async () => {
    if (!advisoryText) { toast.error('Generate advisory first'); return; }
    setAdvisoryLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/tts', { text: advisoryText, language: advisoryInput.language || 'en' });
      if (res.data.success && res.data.audio_base64) {
        const blob = b64ToBlob(res.data.audio_base64, 'audio/mpeg');
        const url = URL.createObjectURL(blob); setAdvisoryAudioUrl(url);
      } else toast.error('TTS failed');
    } catch (e) { toast.error('Server error while generating TTS'); }
    finally { setAdvisoryLoading(false); }
  };


  // Pest detection
  const submitPestDetection = async () => {
    if (!pestImage) { toast.error('Select an image'); return; }
    setPestLoading(true); setPestResult(null);
    try {
      const form = new FormData(); form.append('image', pestImage);
      const res = await axios.post('http://localhost:5000/api/pest-detect', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      if (res.data.success) { setPestResult(res.data.prediction); toast.success('Analysis complete'); }
      else toast.error('Detection failed');
    } catch (e) { toast.error('Server error during detection'); }
    finally { setPestLoading(false); }
  };

  // Market
  const fetchMarketPrices = async () => {
    setMarketLoading(true); setMarketData(null);
    try {
      const res = await axios.get('http://localhost:5000/api/market-prices', { params: { crop: marketQuery.crop, state: marketQuery.state } });
      if (res.data.success) { setMarketData(res.data.prices); toast.success('Market prices loaded'); }
      else toast.error('Failed to load prices');
    } catch (e) { toast.error('Server error while loading prices'); }
    finally { setMarketLoading(false); }
  };

  // Feedback
  const submitFeedback = async () => {
    if (!feedback.comments?.trim()) { toast.error('Please enter your comments'); return; }
    setFeedbackLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/feedback', feedback);
      if (res.data.success) { toast.success('Thanks for your feedback!'); setFeedback(prev => ({ ...prev, comments: '' })); }
      else toast.error('Failed to submit feedback');
    } catch (e) { toast.error('Server error while submitting feedback'); }
    finally { setFeedbackLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">{t('advisor.title')}</h1>
          <p className="text-gray-600 mt-2">{t('advisor.subtitle')}</p>
        </div>

        <div className="space-y-8">
              {/* Advisory */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('advisor.advisory')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">{t('label.crop')}</label>
                <select className="input-field" value={advisoryInput.crop_type} onChange={(e) => setAdvisoryInput(prev => ({ ...prev, crop_type: e.target.value }))}>
                  <option value="">Select crop</option>
                  {crops.map(c => (<option key={c.value} value={c.value}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="label">{t('label.language')}</label>
                <select className="input-field" value={advisoryInput.language} onChange={(e) => setAdvisoryInput(prev => ({ ...prev, language: e.target.value }))}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="te">Telugu</option>
                  <option value="ta">Tamil</option>
                  <option value="bn">Bengali</option>
                  <option value="mr">Marathi</option>
                </select>
              </div>
              <div>
                <label className="label">{t('label.location_optional')}</label>
                <input className="input-field" placeholder="e.g., Farm Block A" value={advisoryInput.location_query} onChange={(e) => setAdvisoryInput(prev => ({ ...prev, location_query: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">{t('label.state')} (optional)</label>
                  <select className="input-field" value={advisoryInput.state} onChange={(e) => setAdvisoryInput(prev => ({ ...prev, state: e.target.value, district: '' }))}>
                    <option value="">Select state</option>
                    {statesList.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <div>
                  <label className="label">{t('label.district')} (optional)</label>
                  <select className="input-field" value={advisoryInput.district} onChange={(e) => setAdvisoryInput(prev => ({ ...prev, district: e.target.value }))}>
                    <option value="">Select district</option>
                    {districtsList.map((d) => (<option key={d} value={d}>{d}</option>))}
                  </select>
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <button onClick={fetchAdvisory} disabled={advisoryLoading} className="btn-primary">{advisoryLoading ? '...' : t('button.generate_advisory')}</button>
              <button onClick={speakAdvisory} disabled={advisoryLoading || !advisoryText} className="btn-secondary">{t('button.speak_advisory')}</button>
            </div>
            {advisoryText && (
              <div className="mt-4">
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded border">{advisoryText}</pre>
                {advisoryAudioUrl && (
                  <audio controls className="mt-3 w-full">
                    <source src={advisoryAudioUrl} type="audio/mpeg" />
                  </audio>
                )}
              </div>
            )}
          </div>


          {/* Pest Detection */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('advisor.pest')}</h2>
            <div className="grid md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2">
                <label className="label">{t('label.upload_leaf_image')}</label>
                <input type="file" accept="image/*" className="input-field" onChange={(e) => setPestImage(e.target.files?.[0] || null)} />
              </div>
              <button onClick={submitPestDetection} disabled={pestLoading} className="btn-primary">{pestLoading ? '...' : t('button.analyze_image')}</button>
            </div>
            {pestResult && (
              <div className="mt-4 text-sm text-gray-700">
                <p><strong>Label:</strong> {pestResult.label}</p>
                <p><strong>Confidence:</strong> {(pestResult.confidence * 100).toFixed(1)}%</p>
                <p><strong>Advice:</strong> {pestResult.advice}</p>
              </div>
            )}
          </div>

          {/* Market Prices */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('advisor.market')}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">{t('label.crop')}</label>
                <select className="input-field" value={marketQuery.crop} onChange={(e) => setMarketQuery(prev => ({ ...prev, crop: e.target.value }))}>
                  <option value="">Select crop</option>
                  {crops.map(c => (<option key={c.value} value={c.value}>{c.name}</option>))}
                </select>
              </div>
              <div>
                <label className="label">{t('label.state')}</label>
                <select className="input-field" value={marketQuery.state} onChange={(e) => setMarketQuery(prev => ({ ...prev, state: e.target.value }))}>
                  <option value="">Select state</option>
                  {statesList.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div className="flex items-end">
                <button onClick={fetchMarketPrices} disabled={marketLoading} className="btn-primary w-full">{marketLoading ? '...' : t('button.get_prices')}</button>
              </div>
            </div>
            {marketData && (
              <div className="mt-4 grid sm:grid-cols-4 gap-4 text-sm">
                <div className="border rounded p-3"><div className="text-gray-500">{t('market.min')}</div><div className="font-semibold">{marketData.min} {marketData.unit}</div></div>
                <div className="border rounded p-3"><div className="text-gray-500">{t('market.avg')}</div><div className="font-semibold">{marketData.avg} {marketData.unit}</div></div>
                <div className="border rounded p-3"><div className="text-gray-500">{t('market.max')}</div><div className="font-semibold">{marketData.max} {marketData.unit}</div></div>
                <div className="border rounded p-3"><div className="text-gray-500">{t('market.source')}</div><div className="font-semibold">{marketData.source}</div></div>
              </div>
            )}
          </div>

          {/* Feedback */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('advisor.feedback')}</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="label">{t('label.feature')}</label>
                <select className="input-field" value={feedback.feature} onChange={(e) => setFeedback(prev => ({ ...prev, feature: e.target.value }))}>
                  <option value="advisory">Advisory</option>
                  <option value="weather">Weather</option>
                  <option value="pest-detect">Pest Detection</option>
                  <option value="market-prices">Market Prices</option>
                </select>
              </div>
              <div>
                <label className="label">{t('label.rating')}</label>
                <input type="number" min="1" max="5" className="input-field" value={feedback.rating} onChange={(e) => setFeedback(prev => ({ ...prev, rating: Number(e.target.value) }))} />
              </div>
              <div className="md:col-span-3">
                <label className="label">{t('label.comments')}</label>
                <textarea rows="3" className="input-field" placeholder="Share your thoughts..." value={feedback.comments} onChange={(e) => setFeedback(prev => ({ ...prev, comments: e.target.value }))}></textarea>
              </div>
            </div>
            <div className="mt-4">
              <button onClick={submitFeedback} disabled={feedbackLoading} className="btn-primary">{feedbackLoading ? '...' : t('button.submit_feedback')}</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advisor;
