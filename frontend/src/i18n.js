import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const I18nContext = createContext({ t: (k) => k, lang: 'en', setLang: () => {} });

const messages = {
  en: {
    'nav.home': 'Home',
    'nav.recommendation': 'Recommendation',
    'nav.advisor': 'Advisor',
    'nav.soil': 'Soil Analysis',
    'nav.dashboard': 'Dashboard',
    'nav.about': 'About',

    'advisor.title': 'Advisor',
    'advisor.subtitle': 'AI Advisory, Weather, Pest Detection, Market Prices and Feedback.',
    'advisor.advisory': 'AI Advisory (Multilingual & Location-aware)',
    'advisor.weather': 'Weather Alerts & Insights',
    'advisor.pest': 'Pest/Disease Detection (Image)',
    'advisor.market': 'Market Prices',
    'advisor.feedback': 'Feedback',

    'rec.title': 'Fertilizer Recommendation System',
    'rec.cta': 'Get Recommendations',
    'rec.header': 'Fertilizer Recommendation System',
    'rec.input_parameters': 'Input Parameters',
    'rec.results': 'Fertilizer Recommendations',

    'dashboard.trends': 'Market Price Trends',
    'dashboard.avg_yields': 'Average Crop Yields',
    'dashboard.deficiencies': 'Common Deficiencies',

    'about.title': 'About AgriTech',

    'label.crop': 'Crop',
    'label.state': 'State',
    'label.district': 'District',
    'label.language': 'Language',
    'label.location_optional': 'Location (optional free text)',
    'label.upload_leaf_image': 'Upload leaf image',
    'label.alerts': 'Alerts',
    'label.insights': 'Insights',
    'label.days': 'Days',
    'label.feature': 'Feature',
    'label.rating': 'Rating',
    'label.comments': 'Comments',

    'button.generate_advisory': 'Generate Advisory',
    'button.speak_advisory': 'Speak Advisory',
    'button.get_weather_alerts': 'Get Weather Alerts',
    'button.analyze_image': 'Analyze Image',
    'button.get_prices': 'Get Prices',
    'button.download_csv': 'Download CSV',
    'button.submit_feedback': 'Submit Feedback',

    'market.min': 'Min',
    'market.avg': 'Avg',
    'market.max': 'Max',
    'market.source': 'Source',

    'home.hero.title1': 'Smart Fertilizer',
    'home.hero.title2': 'Recommendations',
    'home.hero.subtitle': 'Revolutionize your farming with AI-powered fertilizer recommendations. Optimize crop nutrition, increase yields, and promote sustainable agriculture.',
    'home.hero.cta_recommendation': 'Get Recommendations',
    'home.hero.cta_soil': 'Analyze Soil',
    'home.features.title': 'Powerful Features for Modern Farming',
    'home.features.subtitle': 'Our comprehensive platform provides everything you need for data-driven agricultural decisions.',
    'home.benefits.title': 'Why Choose Our Platform?',
    'home.benefits.subtitle': 'Join thousands of farmers who have transformed their agricultural practices with our intelligent fertilizer recommendation system.',
    'home.benefits.learn_more': 'Learn More',
    'home.cta.title': 'Ready to Get Started?',
    'home.cta.subtitle': 'Get personalized fertilizer recommendations in just a few clicks. Input your soil parameters and crop details to receive expert guidance.',
    'home.cta.start_now': 'Start Now',
    'home.cta.get_started': 'Get Started Free',
    'home.cta.view_dashboard': 'View Dashboard',

    'soil.title': 'Soil Health Analysis',
    'soil.enter_params': 'Enter Soil Parameters',
    'soil.analyze': 'Analyze Soil',
    'soil.results': 'Results'
  },

  hi: {
    'nav.home': 'होम',
    'nav.recommendation': 'सिफारिश',
    'nav.advisor': 'सलाहकार',
    'nav.soil': 'मृदा विश्लेषण',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.about': 'परिचय',

    'advisor.title': 'सलाहकार',
    'advisor.subtitle': 'एआई सलाह, मौसम, कीट पहचान, बाजार मूल्य और प्रतिक्रिया।',
    'advisor.advisory': 'एआई सलाह (बहुभाषी और स्थान-सचेत)',
    'advisor.weather': 'मौसम चेतावनियाँ और अंतर्दृष्टि',
    'advisor.pest': 'कीट/रोग पहचान (छवि)',
    'advisor.market': 'बाजार मूल्य',
    'advisor.feedback': 'प्रतिक्रिया',

    'rec.title': 'उर्वरक सिफारिश प्रणाली',
    'rec.cta': 'सिफारिश प्राप्त करें',

    'dashboard.trends': 'बाजार मूल्य प्रवृत्तियाँ',

    'about.title': 'एग्रीटेक के बारे में'
  },

  te: {
    'nav.home': 'హోమ్',
    'nav.recommendation': 'సిఫార్సు',
    'nav.advisor': 'సలహాదారు',
    'nav.soil': 'మట్టి విశ్లేషణ',
    'nav.dashboard': 'డాష్‌బోర్డ్',
    'nav.about': 'గురించి',

    'advisor.title': 'సలహాదారు',
    'advisor.subtitle': 'ఎఐ సలహా, వాతావరణం, పురుగు గుర్తింపు, మార్కెట్ ధరలు మరియు అభిప్రాయం.',
    'advisor.advisory': 'ఎఐ సలహా (బహుభాష & స్థానం-సూచకం)',
    'advisor.weather': 'వాతావరణ హెచ్చరికలు & అంతర్దృష్టులు',
    'advisor.pest': 'పురుగు/వ్యాధి గుర్తింపు (చిత్రం)',
    'advisor.market': 'మార్కెట్ ధరలు',
    'advisor.feedback': 'అభిప్రాయం',

    'rec.title': 'ఎరువు సిఫార్సు వ్యవస్థ',
    'rec.cta': 'సిఫార్సులు పొందండి',

    'dashboard.trends': 'మార్కెట్ ధర ధోరణులు',

    'about.title': 'అగ్రిటెక్ గురించి'
  },

  ta: {
    'nav.home': 'முகப்பு',
    'nav.recommendation': 'பரிந்துரை',
    'nav.advisor': 'ஆலோசகர்',
    'nav.soil': 'மண் பகுப்பாய்வு',
    'nav.dashboard': 'டாஷ்போர்டு',
    'nav.about': 'பற்றி',

    'advisor.title': 'ஆலோசகர்',
    'advisor.subtitle': 'எஐ ஆலோசனை, வானிலை, பூச்சி கண்டறிதல், சந்தை விலை மற்றும் கருத்து.',
    'advisor.advisory': 'எஐ ஆலோசனை (பன்மொழி & இடம்-அறிவு)',
    'advisor.weather': 'வானிலை எச்சரிக்கைகள் & உள்ளடக்கம்',
    'advisor.pest': 'பூச்சி/நோய் கண்டறிதல் (படம்)',
    'advisor.market': 'சந்தை விலைகள்',
    'advisor.feedback': 'கருத்து',

    'rec.title': 'உர பரிந்துரைத்துறை',
    'rec.cta': 'பரிந்துரைகளைப் பெற',
    'rec.header': 'உர பரிந்துரைத்துறை',
    'rec.input_parameters': 'உள்ளீட்டு அளவுருக்கள்',
    'rec.results': 'உர பரிந்துரைகள்',

    'dashboard.trends': 'சந்தை விலை போக்குகள்',
    'dashboard.avg_yields': 'சராசரி பயிர் மகசூல்',
    'dashboard.deficiencies': 'பொது குறைவுகள்',

    'about.title': 'அக்ரிடெக் பற்றி',

    'label.crop': 'பயிர்',
    'label.state': 'மாநிலம்',
    'label.district': 'மாவட்டம்',
    'label.language': 'மொழி',
    'label.location_optional': 'இடம் (விருப்பம்)',
    'label.upload_leaf_image': 'இலைப்படத்தைப் பதிவேற்றவும்',
    'label.alerts': 'எச்சரிக்கைகள்',
    'label.insights': 'உள்ளடக்கம்',
    'label.days': 'நாட்கள்',
    'label.feature': 'அம்சம்',
    'label.rating': 'மதிப்பீடு',
    'label.comments': 'கருத்துகள்',

    'button.generate_advisory': 'ஆலோசனையை உருவாக்கு',
    'button.speak_advisory': 'ஆலோசனையை கேள்',
    'button.get_weather_alerts': 'வானிலை எச்சரிக்கைகள் பெற',
    'button.analyze_image': 'படத்தை பகுப்பாய்வு செய்',
    'button.get_prices': 'விலைகள் பெற',
    'button.download_csv': 'CSV பதிவிறக்கு',
    'button.submit_feedback': 'கருத்தை சமர்ப்பிக்கவும்',

    'market.min': 'குறைந்தது',
    'market.avg': 'சராசரி',
    'market.max': 'அதிகபட்சம்',
    'market.source': 'மூலம்',

    'home.hero.title1': 'ஸ்மார்ட் உர',
    'home.hero.title2': 'பரிந்துரைகள்',
    'home.hero.subtitle': 'எஐ ஆதரவு உர பரிந்துரைகளுடன் உங்கள் விவசாயத்தை மாற்றியமைக்கவும். சாகுபடி ஊட்டச்சத்து மேம்பட்டு, மகசூல் அதிகரிக்கும்.',
    'home.hero.cta_recommendation': 'பரிந்துரைகள் பெற',
    'home.hero.cta_soil': 'மண் பகுப்பாய்வு',
    'home.features.title': 'நவீன விவசாயத்திற்கு சக்திவாய்ந்த அம்சங்கள்',
    'home.features.subtitle': 'தரத்தை அடிப்படையாகக் கொண்ட தீர்மானங்களுக்கு தேவையான அனைத்தையும் எங்கள் தளம் வழங்குகிறது.',
    'home.benefits.title': 'ஏன் எங்களைத் தேர்ந்தெடுக்க வேண்டும்?',
    'home.benefits.subtitle': 'ஆயிரக்கணக்கான விவசாயிகள் எங்கள் சிக்கனமான உர பரிந்துரைத் தளத்துடன் முன்னேற்றம் கண்டுள்ளனர்.',
    'home.benefits.learn_more': 'மேலும் அறிய',
    'home.cta.title': 'தொடங்க தயாரா?',
    'home.cta.subtitle': 'சில கிளிக்குகளில் தனிப்பயன் உர பரிந்துரைகளைப் பெறுங்கள்.',
    'home.cta.start_now': 'இப்போது தொடங்கு',
    'home.cta.get_started': 'இலவசமாக தொடங்குங்கள்',
    'home.cta.view_dashboard': 'டாஷ்போர்டைக் காண்க',

    'soil.title': 'மண் ஆரோக்கிய பகுப்பாய்வு',
    'soil.enter_params': 'மண் அளவுருக்கள் உள்ளிடவும்',
    'soil.analyze': 'மண்ணை பகுப்பாய்வு செய்',
    'soil.results': 'முடிவுகள்'
  },

  mr: {
    'nav.home': 'मुख्यपृष्ठ',
    'nav.recommendation': 'शिफारस',
    'nav.advisor': 'सलाहकार',
    'nav.soil': 'मृदा विश्लेषण',
    'nav.dashboard': 'डॅशबोर्ड',
    'nav.about': 'विषयी',

    'advisor.title': 'सलाहकार',
    'advisor.subtitle': 'एआय सल्ला, हवामान, कीड ओळख, बाजारभाव आणि अभिप्राय.',
    'advisor.advisory': 'एआय सल्ला (बहुभाषिक व स्थान-जाणकार)',
    'advisor.weather': 'हवामान अलर्ट व अंतर्दृष्टी',
    'advisor.pest': 'कीड/रोग शोध (प्रतिमा)',
    'advisor.market': 'बाजार भाव',
    'advisor.feedback': 'अभिप्राय',

    'rec.title': 'खत शिफारस प्रणाली',
    'rec.cta': 'शिफारसी मिळवा',

    'dashboard.trends': 'बाजारभाव कल',

    'about.title': 'ऍग्रीटेक बद्दल'
  },

  bn: {
    'nav.home': 'হোম',
    'nav.recommendation': 'সুপারিশ',
    'nav.advisor': 'উপদেষ্টা',
    'nav.soil': 'মাটি বিশ্লেষণ',
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.about': 'সম্পর্কে',

    'advisor.title': 'উপদেষ্টা',
    'advisor.subtitle': 'এআই পরামর্শ, আবহাওয়া, পোকা সনাক্তকরণ, বাজার মূল্য এবং প্রতিক্রিয়া।',
    'advisor.advisory': 'এআই পরামর্শ (বহুভাষী ও অবস্থান-সচেতন)',
    'advisor.weather': 'আবহাওয়া সতর্কতা ও অন্তর্দৃষ্টি',
    'advisor.pest': 'পোকা/রোগ সনাক্তকরণ (ছবি)',
    'advisor.market': 'বাজার মূল্য',
    'advisor.feedback': 'প্রতিক্রিয়া',

    'rec.title': 'সার সুপারিশ সিস্টেম',
    'rec.cta': 'সুপারিশ নিন',

    'dashboard.trends': 'বাজার মূল্য প্রবণতা',

    'about.title': 'অ্যাগ্রিটেক সম্পর্কে'
  }
};

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('site_lang') || 'en'; } catch (_) { return 'en'; }
  });
  useEffect(() => {
    try { localStorage.setItem('site_lang', lang); } catch (_) {}
  }, [lang]);

  const t = useMemo(() => {
    const table = messages[lang] || messages.en;
    return (key) => table[key] || messages.en[key] || key;
  }, [lang]);

  const value = useMemo(() => ({ t, lang, setLang }), [t, lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);