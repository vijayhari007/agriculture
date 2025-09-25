import React from 'react';

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">About AgriTech</h1>
          <p className="text-gray-700 leading-relaxed mb-4">
            AgriTech is an intelligent fertilizer and advisory platform that empowers farmers with
            data‑driven insights. It combines soil analytics, crop knowledge, weather awareness, and
            market information to provide practical recommendations in multiple languages.
          </p>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">What’s Included</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Fertilizer Recommendations</strong>: Input soil pH, N, P, K and get prioritized, explainable suggestions.</li>
            <li><strong>Advisor Page</strong> (/advisor):
              <ul className="list-disc list-inside ml-6 space-y-1">
                <li><strong>AI Advisory (Multilingual & Location‑aware)</strong> with automatic geocoding by district/state (no lat/lon needed).</li>
                <li><strong>Weather Alerts & Insights</strong> powered by OpenWeather, resolved from place names.</li>
                <li><strong>Pest/Disease Detection</strong> from leaf images (lightweight heuristic MVP).</li>
                <li><strong>Market Prices</strong> with crop/state specific variation and unit awareness.</li>
                <li><strong>Feedback</strong> collection to improve features.</li>
              </ul>
            </li>
            <li><strong>Dashboard Analytics</strong>: Yield and deficiencies, plus a <strong>Market Price Trends</strong> chart with crop/state/district filters, days selector (30/60/90), CSV export, and unit tooltips.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Key Capabilities</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Multilingual advisory</strong> with translation and Text‑to‑Speech (TTS) playback.</li>
            <li><strong>Location by name</strong>: state/district inputs geocoded to coordinates automatically.</li>
            <li><strong>Weather‑aware tips</strong>: rain/heat alerts and actionable insights.</li>
            <li><strong>Market trends</strong>: deterministic crop/state/district series for quick planning, with CSV export.</li>
            <li><strong>Usability</strong>: modern UI with dropdowns, search, toasts, and clear visualizations.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">APIs & Integrations</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>OpenWeather</strong>: One Call and Geocoding APIs for current and forecast data (requires <code>OPENWEATHER_API_KEY</code> in <code>backend/.env</code>).</li>
            <li><strong>Translation/TTS</strong>: Google Translate (via deep‑translator) and gTTS for voice playback.</li>
            <li><strong>Market Prices</strong>: mock endpoints with state/district variation and historical series; designed to swap in live sources (e.g., Agmarknet) when available.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Datasets</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li><strong>Soil data</strong> (e.g., pH, N, P, K, organic matter, temperature, moisture, state, district).</li>
            <li><strong>Crops</strong> (names, seasons) used across Recommendation, Advisor, and Dashboard filters.</li>
            <li><strong>Fertilizers</strong> (types, compositions, indicative pricing) for guidance.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">How to Run</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-2">
            <li>Backend: <code>python backend/app.py</code> (after <code>pip install -r backend/requirements.txt</code> and setting <code>OPENWEATHER_API_KEY</code>).</li>
            <li>Frontend: <code>npm start</code> in <code>frontend/</code> (or run <code>run-dev.ps1</code> to open both).</li>
            <li>Use the <strong>Advisor</strong> page for advisory, weather, pest detection, prices, and feedback.</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-3">Disclaimer</h2>
          <p className="text-gray-700">
            This application provides guidance for educational purposes. Always consult local agricultural
            experts and perform field validations before making critical decisions.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;
