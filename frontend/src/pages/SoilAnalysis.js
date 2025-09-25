import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { BeakerIcon } from '@heroicons/react/24/outline';

const SoilAnalysis = () => {
  const [formData, setFormData] = useState({
    soil_ph: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    organic_matter: ''
  });

  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const required = ['soil_ph', 'nitrogen', 'phosphorus', 'potassium'];
    const missing = required.filter((k) => !formData[k]);
    if (missing.length) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/soil-analysis', formData);
      if (res.data.success) {
        setAnalysis(res.data.analysis);
        toast.success('Soil analysis completed');
      } else {
        toast.error('Failed to analyze soil');
      }
    } catch (err) {
      toast.error('Server error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const Badge = ({ label, color }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${color}-100 text-${color}-800 border border-${color}-200`}>
      {label}
    </span>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Soil Health Analysis</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Assess your soil's nutrient status and get actionable recommendations to improve soil health.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="card">
            <div className="flex items-center space-x-2 mb-6">
              <BeakerIcon className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-semibold text-gray-900">Enter Soil Parameters</h2>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Soil pH *</label>
                  <input type="number" name="soil_ph" value={formData.soil_ph} onChange={handleInputChange} step="0.1" min="4" max="9" placeholder="6.5" className="input-field" required />
                </div>
                <div>
                  <label className="label">Organic Matter (%)</label>
                  <input type="number" name="organic_matter" value={formData.organic_matter} onChange={handleInputChange} step="0.1" min="0" max="10" placeholder="2.5" className="input-field" />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Nitrogen (kg/ha) *</label>
                  <input type="number" name="nitrogen" value={formData.nitrogen} onChange={handleInputChange} step="0.1" min="0" max="500" placeholder="100" className="input-field" required />
                </div>
                <div>
                  <label className="label">Phosphorus (kg/ha) *</label>
                  <input type="number" name="phosphorus" value={formData.phosphorus} onChange={handleInputChange} step="0.1" min="0" max="200" placeholder="60" className="input-field" required />
                </div>
                <div>
                  <label className="label">Potassium (kg/ha) *</label>
                  <input type="number" name="potassium" value={formData.potassium} onChange={handleInputChange} step="0.1" min="0" max="300" placeholder="80" className="input-field" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full btn-primary">
                {loading ? 'Analyzing...' : 'Analyze Soil'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Results</h2>
            {!analysis ? (
              <div className="text-center py-12 text-gray-500">Enter parameters and click Analyze to view results.</div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Overall Rating</h3>
                  <div className="flex items-center space-x-3">
                    <span className="text-3xl font-bold text-primary-600">{analysis.overall_rating.score}</span>
                    <Badge label={analysis.overall_rating.rating} color={analysis.overall_rating.rating === 'Excellent' ? 'green' : analysis.overall_rating.rating === 'Good' ? 'blue' : analysis.overall_rating.rating === 'Fair' ? 'yellow' : 'red'} />
                    <span className="text-gray-500">/ {analysis.overall_rating.max_score}</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">pH Status</h4>
                    <Badge label={analysis.ph_status.level} color={analysis.ph_status.color} />
                    <p className="text-sm text-gray-600 mt-2">{analysis.ph_status.recommendation}</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Nitrogen</h4>
                    <Badge label={analysis.nitrogen_status.level} color={analysis.nitrogen_status.color} />
                    <p className="text-sm text-gray-600 mt-2">{analysis.nitrogen_status.recommendation}</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Phosphorus</h4>
                    <Badge label={analysis.phosphorus_status.level} color={analysis.phosphorus_status.color} />
                    <p className="text-sm text-gray-600 mt-2">{analysis.phosphorus_status.recommendation}</p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Potassium</h4>
                    <Badge label={analysis.potassium_status.level} color={analysis.potassium_status.color} />
                    <p className="text-sm text-gray-600 mt-2">{analysis.potassium_status.recommendation}</p>
                  </div>

                  <div className="border rounded-lg p-4 md:col-span-2">
                    <h4 className="font-semibold text-gray-900 mb-2">Organic Matter</h4>
                    <Badge label={analysis.organic_matter_status.level} color={analysis.organic_matter_status.color} />
                    <p className="text-sm text-gray-600 mt-2">{analysis.organic_matter_status.recommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoilAnalysis;
