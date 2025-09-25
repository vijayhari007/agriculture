import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  SparklesIcon, 
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import SearchableSelect from '../components/SearchableSelect';
import AsyncSearchSelect from '../components/AsyncSearchSelect';

const Recommendation = () => {
  const [formData, setFormData] = useState({
    crop_type: '',
    soil_name: '',
    soil_type: '',
    soil_ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organic_matter: '',
    moisture: '',
    temperature: ''
  });

  const [crops, setCrops] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // New feature states
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

  const [weatherPlace, setWeatherPlace] = useState({ district: '', state: '' });
  const [weatherAlerts, setWeatherAlerts] = useState([]);
  const [weatherInsights, setWeatherInsights] = useState([]);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const [pestImage, setPestImage] = useState(null);
  const [pestResult, setPestResult] = useState(null);
  const [pestLoading, setPestLoading] = useState(false);

  const [marketQuery, setMarketQuery] = useState({ crop: 'wheat', state: 'Maharashtra' });
  const [marketData, setMarketData] = useState(null);
  const [marketLoading, setMarketLoading] = useState(false);

  const [feedback, setFeedback] = useState({ feature: 'advisory', rating: 5, comments: '' });
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Location lists for dropdowns
  const [statesList, setStatesList] = useState([]);
  const [districtsList, setDistrictsList] = useState([]);

  useEffect(() => {
    fetchCrops();
    // Load states for dropdowns
    (async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/locations/states');
        if (res.data.success) setStatesList(res.data.states || []);
      } catch (e) { /* no-op */ }
    })();
  }, []);

  // Load districts when state changes (for both advisory and weather)
  useEffect(() => {
    const state = advisoryInput.state || weatherPlace.state;
    if (!state) {
      setDistrictsList([]);
      return;
    }
    (async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/locations/districts', { params: { state } });
        if (res.data.success) setDistrictsList(res.data.districts || []);
      } catch (e) {
        setDistrictsList([]);
      }
    })();
  }, [advisoryInput.state, weatherPlace.state]);

  const fetchCrops = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/crops');
      setCrops(response.data.crops);
    } catch (error) {
      toast.error('Failed to load crops data');
    }
  };

  // Advisory handlers
  const fetchAdvisory = async () => {
    if (!advisoryInput.crop_type) {
      toast.error('Select a crop for advisory');
      return;
    }
    setAdvisoryLoading(true);
    setAdvisoryText('');
    setAdvisoryAudioUrl('');
    try {
      const payload = {
        crop_type: advisoryInput.crop_type,
        location_query: advisoryInput.location_query,
        district: advisoryInput.district,
        state: advisoryInput.state,
        language: advisoryInput.language,
      };
      const res = await axios.post('http://localhost:5000/api/advisory', payload);
      if (res.data.success) {
        setAdvisoryText(res.data.advisory || res.data.advisory_en || '');
        toast.success('Advisory generated');
      } else {
        toast.error('Failed to get advisory');
      }
    } catch (err) {
      toast.error('Server error while fetching advisory');
      console.error(err);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const speakAdvisory = async () => {
    if (!advisoryText) {
      toast.error('Generate advisory first');
      return;
    }
    setAdvisoryLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/tts', {
        text: advisoryText,
        language: advisoryInput.language || 'en'
      });
      if (res.data.success && res.data.audio_base64) {
        const b64 = res.data.audio_base64;
        const blob = b64ToBlob(b64, 'audio/mpeg');
        const url = URL.createObjectURL(blob);
        setAdvisoryAudioUrl(url);
      } else {
        toast.error('TTS failed');
      }
    } catch (err) {
      toast.error('Server error while generating TTS');
      console.error(err);
    } finally {
      setAdvisoryLoading(false);
    }
  };

  const b64ToBlob = (b64Data, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  // Weather handlers
  const fetchWeatherAlerts = async () => {
    setWeatherLoading(true);
    setWeatherAlerts([]);
    setWeatherInsights([]);
    try {
      const params = {};
      if (weatherPlace.district) params.q = weatherPlace.district;
      if (weatherPlace.state) params.state = weatherPlace.state;
      if (!params.q && !params.state) {
        toast.error('Select a state and optionally a district');
        setWeatherLoading(false);
        return;
      }
      const res = await axios.get('http://localhost:5000/api/weather-alerts', { params });
      if (res.data.success) {
        setWeatherAlerts(res.data.alerts || []);
        setWeatherInsights(res.data.insights || []);
        toast.success('Weather insights loaded');
      } else {
        toast.error('Failed to load weather alerts');
      }
    } catch (err) {
      toast.error('Server error while loading weather');
      console.error(err);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Pest detection handlers
  const submitPestDetection = async () => {
    if (!pestImage) {
      toast.error('Select an image');
      return;
    }
    setPestLoading(true);
    setPestResult(null);
    try {
      const form = new FormData();
      form.append('image', pestImage);
      const res = await axios.post('http://localhost:5000/api/pest-detect', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.success) {
        setPestResult(res.data.prediction);
        toast.success('Analysis complete');
      } else {
        toast.error('Detection failed');
      }
    } catch (err) {
      toast.error('Server error during detection');
      console.error(err);
    } finally {
      setPestLoading(false);
    }
  };

  // Market prices
  const fetchMarketPrices = async () => {
    setMarketLoading(true);
    setMarketData(null);
    try {
      const res = await axios.get('http://localhost:5000/api/market-prices', {
        params: { crop: marketQuery.crop, state: marketQuery.state }
      });
      if (res.data.success) {
        setMarketData(res.data.prices);
        toast.success('Market prices loaded');
      } else {
        toast.error('Failed to load prices');
      }
    } catch (err) {
      toast.error('Server error while loading prices');
      console.error(err);
    } finally {
      setMarketLoading(false);
    }
  };

  // Feedback
  const submitFeedback = async () => {
    if (!feedback.comments?.trim()) {
      toast.error('Please enter your comments');
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/feedback', feedback);
      if (res.data.success) {
        toast.success('Thanks for your feedback!');
        setFeedback(prev => ({ ...prev, comments: '' }));
      } else {
        toast.error('Failed to submit feedback');
      }
    } catch (err) {
      toast.error('Server error while submitting feedback');
      console.error(err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    const requiredFields = ['crop_type', 'soil_ph', 'nitrogen', 'phosphorus', 'potassium'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/recommend', formData);
      
      if (response.data.success) {
        setRecommendations(response.data.recommendations);
        setShowResults(true);
        toast.success('Recommendations generated successfully!');
      } else {
        toast.error('Failed to generate recommendations');
      }
    } catch (error) {
      toast.error('Error connecting to server');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      case 'medium':
        return <InformationCircleIcon className="w-5 h-5" />;
      case 'low':
        return <CheckCircleIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fertilizer Recommendation System
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Get personalized fertilizer recommendations based on your soil conditions and crop requirements.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <SparklesIcon className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Input Parameters</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Find Soil (Auto-fill) */}
              <div className="space-y-2">
                <label className="label">Find Soil by Location / Type (Auto-fill)</label>
                <AsyncSearchSelect
                  searchUrl="http://localhost:5000/api/soils"
                  placeholder="Type city, district, state, or soil type (e.g., Kurnool, Black)"
                  minChars={0}
                  onSelect={(item) => {
                    // Auto-fill relevant fields
                    setFormData(prev => ({
                      ...prev,
                      soil_name: item.location ? `${item.location}, ${item.district}` : prev.soil_name,
                      soil_type: (item.soil_type || '').toLowerCase(),
                      soil_ph: item.ph ?? prev.soil_ph,
                      nitrogen: item.nitrogen ?? prev.nitrogen,
                      phosphorus: item.phosphorus ?? prev.phosphorus,
                      potassium: item.potassium ?? prev.potassium,
                      organic_matter: item.organic_matter ?? prev.organic_matter,
                      moisture: item.moisture ?? prev.moisture,
                      temperature: item.temperature ?? prev.temperature,
                    }));
                    toast.success('Soil details applied');
                  }}
                />
                <p className="text-xs text-gray-500">Selecting a result will auto-fill pH, N, P, K, OM, and optionally moisture/temperature.</p>
              </div>

              {/* Soil Identity */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Soil Name (Optional)</label>
                  <input
                    type="text"
                    name="soil_name"
                    value={formData.soil_name}
                    onChange={handleInputChange}
                    className="input-field"
                    placeholder="e.g., Farm Block A / Kurnool Plot"
                  />
                </div>
                <div>
                  <label className="label">Soil Type</label>
                  <select
                    name="soil_type"
                    value={formData.soil_type}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="">Select soil type (optional)</option>
                    <option value="red">Red</option>
                    <option value="black">Black (Vertisol)</option>
                    <option value="alluvial">Alluvial</option>
                    <option value="sandy">Sandy</option>
                    <option value="clay">Clay</option>
                    <option value="loam">Loam</option>
                    <option value="laterite">Laterite</option>
                  </select>
                </div>
              </div>
              {/* Crop Selection (Searchable, starts empty, no suggestions until typing) */}
              <div>
                <label className="label">Crop Type *</label>
                <SearchableSelect
                  placeholder="Start typing to search crops..."
                  items={crops.map(c => ({ label: `${c.name} (${c.season})`, value: c.value }))}
                  value={formData.crop_type}
                  onChange={(val) => setFormData(prev => ({ ...prev, crop_type: val }))}
                  minChars={0}
                />
              </div>

              {/* Soil Parameters */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Soil pH *</label>
                  <input
                    type="number"
                    name="soil_ph"
                    value={formData.soil_ph}
                    onChange={handleInputChange}
                    step="0.1"
                    min="4"
                    max="9"
                    className="input-field"
                    placeholder="6.5"
                    required
                  />
                </div>

                <div>
                  <label className="label">Temperature (°C)</label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    step="0.1"
                    min="10"
                    max="45"
                    className="input-field"
                    placeholder="25"
                  />
                </div>
              </div>

              {/* Nutrient Levels */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Nitrogen (kg/ha) *</label>
                  <input
                    type="number"
                    name="nitrogen"
                    value={formData.nitrogen}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="500"
                    className="input-field"
                    placeholder="80"
                    required
                  />
                </div>

                <div>
                  <label className="label">Phosphorus (kg/ha) *</label>
                  <input
                    type="number"
                    name="phosphorus"
                    value={formData.phosphorus}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="200"
                    className="input-field"
                    placeholder="40"
                    required
                  />
                </div>

                <div>
                  <label className="label">Potassium (kg/ha) *</label>
                  <input
                    type="number"
                    name="potassium"
                    value={formData.potassium}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="300"
                    className="input-field"
                    placeholder="60"
                    required
                  />
                </div>
              </div>

              {/* Additional Parameters */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Organic Matter (%)</label>
                  <input
                    type="number"
                    name="organic_matter"
                    value={formData.organic_matter}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="10"
                    className="input-field"
                    placeholder="2.5"
                  />
                </div>

                <div>
                  <label className="label">Moisture (%)</label>
                  <input
                    type="number"
                    name="moisture"
                    value={formData.moisture}
                    onChange={handleInputChange}
                    step="0.1"
                    min="0"
                    max="100"
                    className="input-field"
                    placeholder="40"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    <span>Generating Recommendations...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    <span>Get Recommendations</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Fertilizer Recommendations
            </h2>

            {!showResults ? (
              <div className="text-center py-12">
                <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Fill in the form and click "Get Recommendations" to see personalized fertilizer suggestions.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recommendations available.</p>
                  </div>
                ) : (
                  recommendations.map((rec, index) => (
                    <div
                      key={index}
                      className={`border rounded-lg p-4 ${getPriorityColor(rec.priority)}`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getPriorityIcon(rec.priority)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">{rec.product}</h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                              {rec.priority.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm mb-2">
                            <strong>Quantity:</strong> {rec.quantity}
                          </p>
                          <p className="text-sm mb-2">
                            <strong>Type:</strong> {rec.type}
                          </p>
                          <p className="text-sm">
                            <strong>Reason:</strong> {rec.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Information Cards */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="card text-center">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <InformationCircleIcon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Accurate Analysis</h3>
            <p className="text-sm text-gray-600">
              Our AI system analyzes multiple soil and crop parameters to provide precise recommendations.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircleIcon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Proven Results</h3>
            <p className="text-sm text-gray-600">
              Farmers using our recommendations see 15-25% increase in crop yields on average.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Smart Technology</h3>
            <p className="text-sm text-gray-600">
              Advanced machine learning algorithms trained on thousands of agricultural data points.
            </p>
          </div>
        </div>

        {/* Advisor features moved to the Advisor page (/advisor). */}
      </div>
    </div>
  );
};

export default Recommendation;
