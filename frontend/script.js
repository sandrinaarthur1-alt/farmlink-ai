function isLoggedIn() {
    return sessionStorage.getItem('isLoggedIn') === 'true';
}

function getUsers() {
    const users = localStorage.getItem('farmLinkUsers');
    return users ? JSON.parse(users) : [];
}

function saveUsers(users) {
    localStorage.setItem('farmLinkUsers', JSON.stringify(users));
}

let currentAnalysis = null;
let selectedAssistantLanguage = 'en';

function setSectionVisibility(sectionId) {
    const sectionIds = ['login', 'signup', 'home', 'farmer-input', 'analysis', 'recommendation'];

    sectionIds.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
            element.hidden = id !== sectionId;
            if (id === sectionId) {
                element.classList.remove('view-enter');
                void element.offsetWidth;
                element.classList.add('view-enter');
            }
        }
    });

    document.body.setAttribute('data-theme', sectionId);
    document.body.classList.remove('photo-refresh');
    void document.body.offsetWidth;
    document.body.classList.add('photo-refresh');
}

function syncView() {
    const loginLink = document.getElementById('login-link');
    if (loginLink) {
        loginLink.textContent = isLoggedIn() ? 'Logout' : 'Login';
    }

    if (isLoggedIn()) {
        setSectionVisibility('home');
    } else {
        setSectionVisibility('login');
    }
}

function goToFarmerInput() {
    if (!isLoggedIn()) {
        return;
    }

    setSectionVisibility('farmer-input');
}

function analyze(event) {
    event.preventDefault();

    if (!isLoggedIn()) {
        return;
    }

    const crop = document.getElementById('crop')?.value || 'N/A';
    const quantity = document.getElementById('quantity')?.value || '0';
    const location = document.getElementById('location')?.value || 'N/A';
    const harvestDays = document.getElementById('harvest-days')?.value || '0';
    const cropName = crop.toLowerCase();
    const quantityValue = Number(quantity);
    const harvestDaysValue = Number(harvestDays);

    // Match crops and larger harvests with buyers suited to that type of supply.
    let recommendedBuyer = `Local Market - ${location}`;
    if (cropName.includes('wheat')) {
        recommendedBuyer = 'GrainLink Wholesale';
    } else if (cropName.includes('cotton')) {
        recommendedBuyer = 'Textile Mills Cooperative';
    } else if (cropName.includes('tomato')) {
        recommendedBuyer = 'FreshMart';
    } else if (quantityValue >= 1000) {
        recommendedBuyer = 'Regional Wholesale Market';
    }

    // Short harvest windows and large quantities leave less room for delays.
    let risk = 'Low';
    if (harvestDaysValue <= 2 || quantityValue >= 1000) {
        risk = 'High';
    } else if (harvestDaysValue <= 5 || quantityValue >= 500) {
        risk = 'Medium';
    }

    setSectionVisibility('analysis');

    setTimeout(() => {
        setSectionVisibility('recommendation');
        displayRecommendation(crop, quantity, location, harvestDays, recommendedBuyer, risk);
    }, 2000);
}

function displayRecommendation(crop, quantity, location, harvestDays, recommendedBuyer, risk) {
    const recommendationContent = document.getElementById('recommendation-content');
    if (!recommendationContent) {
        return;
    }

    // Keep the exact displayed analysis available to the assistant as its context.
    const transportEstimate = displayTransportationRecommendation(crop, quantity, location, harvestDays, recommendedBuyer);
    currentAnalysis = { crop, quantity, location, harvestDays, recommendedBuyer, risk, transportEstimate };

    recommendationContent.innerHTML = `
        <p>Crop: ${crop}</p>
        <p>Quantity: ${quantity} kg</p>
        <p>Recommended Buyer: ${recommendedBuyer}</p>
        <p>Risk: ${risk}</p>
        <p>Location: ${location}</p>
        <p>Harvest Window: ${harvestDays} days</p>
    `;

}

function getMarketRecommendation(crop, location, recommendedBuyer) {
    const locationName = location.toLowerCase();

    // These are destination estimates because this project has no live market API.
    if (locationName.includes('bangalore') || locationName.includes('bengaluru')) {
        return {
            name: 'Yeshwanthpur APMC Market',
            address: 'Yeshwanthpur, Bengaluru, Karnataka (estimated destination)',
            coordinates: '13.0285, 77.5400',
            distanceKm: 25,
            contact: 'Unavailable - verify with the official market authority',
            source: 'Estimated destination; no live official market feed is connected'
        };
    }

    if (locationName.includes('mysore') || locationName.includes('mysuru')) {
        return {
            name: 'Mysuru APMC Market',
            address: 'Bandipalya, Mysuru, Karnataka (estimated destination)',
            coordinates: '12.2746, 76.6394',
            distanceKm: 20,
            contact: 'Unavailable - verify with the official market authority',
            source: 'Estimated destination; no live official market feed is connected'
        };
    }

    return {
        name: recommendedBuyer,
        address: `${location} market area (estimated destination)`,
        coordinates: 'Not available',
        distanceKm: 50,
        contact: 'Unavailable - no verified contact source is connected',
        source: 'Estimated destination; no live official market feed is connected'
    };
}

function getTransportationMethod(crop, quantity, distanceKm) {
    const cropName = crop.toLowerCase();
    const quantityValue = Number(quantity);
    const isPerishable = cropName.includes('tomato') || cropName.includes('fruit') || cropName.includes('vegetable');

    if (isPerishable && quantityValue > 300) {
        return {
            name: 'Refrigerated Vehicle',
            reason: 'This helps protect perishable produce during the estimated journey and larger load.'
        };
    }

    if (isPerishable) {
        return {
            name: 'Insulated Van',
            reason: 'This is suitable for a smaller perishable load and helps reduce heat exposure.'
        };
    }

    if (quantityValue >= 1000) {
        return {
            name: 'Truck',
            reason: 'The estimated quantity is large, so a truck can carry the load in fewer trips.'
        };
    }

    if (quantityValue <= 250 && distanceKm <= 30) {
        return {
            name: 'Tractor/Trolley',
            reason: 'This is practical for a smaller nearby farm load when road conditions allow.'
        };
    }

    return {
        name: 'Mini Truck',
        reason: 'This balances load capacity, crop protection, and flexibility for the estimated route.'
    };
}

function getTransportationEstimate(crop, quantity, location, recommendedBuyer) {
    const market = getMarketRecommendation(crop, location, recommendedBuyer);
    const method = getTransportationMethod(crop, quantity, market.distanceKm);
    const methodRates = {
        'Refrigerated Vehicle': 1.8,
        'Insulated Van': 1.45,
        'Truck': 1.25,
        'Mini Truck': 1,
        'Tractor/Trolley': 0.75
    };
    const rateMultiplier = methodRates[method.name] || 1;
    const quantityValue = Number(quantity);
    const travelHours = Math.max(1, Math.ceil(market.distanceKm / 35));
    const estimatedCost = Math.round((900 + market.distanceKm * 18 + quantityValue * 0.35) * rateMultiplier);
    const route = `${location} -> ${market.name} via practical agricultural roads (estimated route)`;

    return { market, method, travelHours, estimatedCost, route };
}

function displayTransportationRecommendation(crop, quantity, location, harvestDays, recommendedBuyer) {
    const transportationPanel = document.getElementById('transportation-recommendation');
    const transportationContent = document.getElementById('transportation-content');
    const directionsLink = document.getElementById('get-directions-link');
    if (!transportationPanel || !transportationContent || !directionsLink) {
        return;
    }

    const estimate = getTransportationEstimate(crop, quantity, location, recommendedBuyer);
    const { market, method, travelHours, estimatedCost, route } = estimate;

    transportationContent.innerHTML = `
        <p><strong>Crop:</strong> ${crop}</p>
        <p><strong>Quantity:</strong> ${quantity} kg</p>
        <p><strong>Recommended Market:</strong> ${market.name}</p>
        <p><strong>Market Location:</strong> ${market.address}</p>
        <p><strong>Market Contact:</strong> ${market.contact}</p>
        <p><strong>Coordinates:</strong> ${market.coordinates}</p>
        <p><strong>Transportation:</strong> ${method.name}</p>
        <p><strong>Why:</strong> ${method.reason}</p>
        <p><strong>Distance:</strong> Approximately ${market.distanceKm} km</p>
        <p><strong>Estimated Time:</strong> Approximately ${travelHours} hour${travelHours === 1 ? '' : 's'}</p>
        <p><strong>Estimated Transport Cost:</strong> Approximately INR ${estimatedCost}</p>
        <p><strong>Recommended Route:</strong> ${route}</p>
        <p><strong>Information Status:</strong> ${market.source}. Distance, time, route, and cost are estimates.</p>
    `;

    directionsLink.href = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(location)}&destination=${encodeURIComponent(market.address)}`;
    const transportStart = document.getElementById('transport-start');
    const transportDestination = document.getElementById('transport-destination');
    const transportCrop = document.getElementById('transport-crop');
    const transportQuantity = document.getElementById('transport-quantity');
    if (transportStart) transportStart.value = location;
    if (transportDestination) transportDestination.value = market.name;
    if (transportCrop) transportCrop.value = crop;
    if (transportQuantity) transportQuantity.value = quantity;
    transportationPanel.hidden = false;
    return estimate;
}

function addAssistantMessage(message, sender) {
    const messages = document.getElementById('ai-messages');
    if (!messages) {
        return;
    }

    const messageElement = document.createElement('p');
    messageElement.className = `ai-message ${sender}`;
    messageElement.textContent = message;
    messages.appendChild(messageElement);
    messages.scrollTop = messages.scrollHeight;
}

function assistantLanguageText(key, values = {}) {
    const messages = {
        en: {
            missing: `I need these details before I can answer reliably: ${values.missing}. Please provide them or run the analysis again.`,
            noAnalysis: 'I do not have a completed analysis yet. Please enter your crop details and run an analysis first.',
            soil: 'Soil moisture was not included in this analysis, so I cannot judge whether the soil is dry. Check the field and confirm an irrigation plan with a local agriculture expert.',
            riskHigh: `The current risk is High because the harvest window is ${values.days} days and the quantity is ${values.quantity} kg. Plan the sale early and contact ${values.buyer} soon. This is general guidance, not a guarantee.`,
            riskMedium: `The current risk is Medium. Your harvest window is ${values.days} days and quantity is ${values.quantity} kg. Keep checking the crop and arrange ${values.buyer} before harvest.`,
            riskLow: `The current risk is Low based on the available harvest window of ${values.days} days and quantity of ${values.quantity} kg. Continue monitoring and confirm the plan with ${values.buyer}.`,
            action: `1. Check the ${values.crop} field regularly.\n2. Prepare the ${values.quantity} kg harvest within ${values.days} days.\n3. Contact ${values.buyer} early from ${values.location}.\n4. For chemicals, fertilizers, irrigation, or disease treatment, follow labels and confirm with an agriculture expert.`,
            result: `Your analysis is for ${values.crop} in ${values.location}, with ${values.quantity} kg expected in ${values.days} days. The buyer is ${values.buyer} and the risk is ${values.risk}.`,
            crop: `The analysis is for ${values.crop}. The website does not contain a separate crop-selection explanation, so I cannot claim why another crop was recommended. The current market path is ${values.buyer}.`,
            weather: 'A live weather forecast is not connected to this website, so I cannot provide current weather. Check a trusted local weather service before making field or transport decisions.',
            price: 'A live market-price source is not connected to this website. I cannot invent a price. Check the latest local market notice or confirm with the recommended buyer.',
            transport: `Estimated transport is approximately ${values.distance} km, ${values.hours} hour(s), and INR ${values.cost}. Best option: ${values.method}. These are estimates, not live route or price data.`,
            market: `The current recommended buyer is ${values.buyer}. The estimated market destination is ${values.market}. Buyer availability and market timings may change, so confirm before transport.`,
            generic: `I can explain your crop, risk, buyer, market, or transport estimate. Ask about one of those topics.`,
            status: 'Status: Based on this website\'s analysis; transport, market, weather, and price information may be estimated or unavailable.'
        },
        kn: {
            missing: `ನಿಖರವಾಗಿ ಉತ್ತರಿಸಲು ಈ ವಿವರಗಳು ಬೇಕು: ${values.missing}. ದಯವಿಟ್ಟು ವಿವರಗಳನ್ನು ನೀಡಿ ಅಥವಾ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಮತ್ತೆ ನಡೆಸಿ.`,
            noAnalysis: 'ಇನ್ನೂ ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣವಾಗಿಲ್ಲ. ಬೆಳೆ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ ನಡೆಸಿ.',
            soil: 'ಈ ವಿಶ್ಲೇಷಣೆಯಲ್ಲಿ ಮಣ್ಣಿನ ತೇವಾಂಶ ಇಲ್ಲ. ಮಣ್ಣು ಒಣಗಿದೆಯೇ ಎಂದು ಇಲ್ಲಿ ಖಚಿತಪಡಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಸ್ಥಳೀಯ ಕೃಷಿ ತಜ್ಞರನ್ನು ಸಂಪರ್ಕಿಸಿ.',
            riskHigh: `ಪ್ರಸ್ತುತ ಅಪಾಯ ಹೆಚ್ಚು. ಕೊಯ್ಲಿಗೆ ${values.days} ದಿನಗಳು ಮತ್ತು ಪ್ರಮಾಣ ${values.quantity} ಕೆಜಿ. ಮಾರಾಟವನ್ನು ಬೇಗ ಯೋಜಿಸಿ ಮತ್ತು ${values.buyer} ಸಂಪರ್ಕಿಸಿ. ಇದು ಸಾಮಾನ್ಯ ಮಾರ್ಗದರ್ಶನ ಮಾತ್ರ.`,
            riskMedium: `ಪ್ರಸ್ತುತ ಅಪಾಯ ಮಧ್ಯಮ. ಕೊಯ್ಲಿಗೆ ${values.days} ದಿನಗಳು ಮತ್ತು ಪ್ರಮಾಣ ${values.quantity} ಕೆಜಿ. ಬೆಳೆಯನ್ನು ಗಮನಿಸಿ ಮತ್ತು ${values.buyer} ಸಂಪರ್ಕಿಸಿ.`,
            riskLow: `ಲಭ್ಯವಿರುವ ಮಾಹಿತಿಯಂತೆ ಪ್ರಸ್ತುತ ಅಪಾಯ ಕಡಿಮೆ. ${values.days} ದಿನಗಳ ಕೊಯ್ಲು ಅವಧಿ ಮತ್ತು ${values.quantity} ಕೆಜಿ ಪ್ರಮಾಣವನ್ನು ಗಮನಿಸಿ.`,
            action: `1. ${values.crop} ಹೊಲವನ್ನು ನಿಯಮಿತವಾಗಿ ಪರಿಶೀಲಿಸಿ.\n2. ${values.quantity} ಕೆಜಿ ಬೆಳೆಯನ್ನು ${values.days} ದಿನಗಳಲ್ಲಿ ಸಿದ್ಧಪಡಿಸಿ.\n3. ${values.buyer} ಅನ್ನು ಮುಂಚಿತವಾಗಿ ಸಂಪರ್ಕಿಸಿ.\n4. ರಸಗೊಬ್ಬರ, ರಾಸಾಯನಿಕ ಅಥವಾ ನೀರಾವರಿಗೆ ತಜ್ಞರ ಸಲಹೆ ಪಡೆಯಿರಿ.`,
            result: `${values.location} ಸ್ಥಳದ ${values.crop} ಬೆಳೆಗಾಗಿ ${values.quantity} ಕೆಜಿ ಮತ್ತು ${values.days} ದಿನಗಳ ಕೊಯ್ಲು ಅವಧಿ ಇದೆ. ಖರೀದಿದಾರ: ${values.buyer}. ಅಪಾಯ: ${values.risk}.`,
            crop: `ವಿಶ್ಲೇಷಣೆ ${values.crop} ಬೆಳೆಗಾಗಿ ಇದೆ. ಬೇರೆ ಬೆಳೆ ಏಕೆ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ ಎಂಬ ಪ್ರತ್ಯೇಕ ಮಾಹಿತಿ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ಇಲ್ಲ.`,
            weather: 'ಈ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನೇರ ಹವಾಮಾನ ಮಾಹಿತಿ ಇಲ್ಲ. ಹೊಲ ಅಥವಾ ಸಾರಿಗೆ ನಿರ್ಧಾರಕ್ಕೂ ಮೊದಲು ವಿಶ್ವಾಸಾರ್ಹ ಸ್ಥಳೀಯ ಹವಾಮಾನ ಸೇವೆಯನ್ನು ಪರಿಶೀಲಿಸಿ.',
            price: 'ಈ ವೆಬ್‌ಸೈಟ್‌ನಲ್ಲಿ ನೇರ ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಮಾಹಿತಿ ಇಲ್ಲ. ಬೆಲೆಯನ್ನು ಊಹಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ. ಸ್ಥಳೀಯ ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಖರೀದಿದಾರರಿಂದ ದೃಢೀಕರಿಸಿ.',
            transport: `ಸಾರಿಗೆ ಅಂದಾಜು: ಸುಮಾರು ${values.distance} ಕಿಮೀ, ${values.hours} ಗಂಟೆ ಮತ್ತು INR ${values.cost}. ಉತ್ತಮ ಆಯ್ಕೆ: ${values.method}. ಇದು ಅಂದಾಜು ಮಾತ್ರ.`,
            market: `ಪ್ರಸ್ತುತ ಶಿಫಾರಸು ಮಾಡಿದ ಖರೀದಿದಾರ: ${values.buyer}. ಅಂದಾಜಿನ ಮಾರುಕಟ್ಟೆ: ${values.market}. ಲಭ್ಯತೆ ಮತ್ತು ಸಮಯವನ್ನು ಮೊದಲು ದೃಢೀಕರಿಸಿ.`,
            generic: 'ನಿಮ್ಮ ಬೆಳೆ, ಅಪಾಯ, ಖರೀದಿದಾರ, ಮಾರುಕಟ್ಟೆ ಅಥವಾ ಸಾರಿಗೆ ಅಂದಾಜಿನ ಬಗ್ಗೆ ಕೇಳಿ.',
            status: 'ಸ್ಥಿತಿ: ವೆಬ್‌ಸೈಟ್‌ನ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಆಧರಿಸಿದೆ; ಸಾರಿಗೆ, ಮಾರುಕಟ್ಟೆ, ಹವಾಮಾನ ಮತ್ತು ಬೆಲೆ ಮಾಹಿತಿ ಅಂದಾಜಾಗಿರಬಹುದು.'
        },
        hi: {
            missing: `विश्वसनीय उत्तर के लिए ये जानकारी चाहिए: ${values.missing}। कृपया जानकारी दें या विश्लेषण फिर चलाएं।`,
            noAnalysis: 'अभी कोई पूरा विश्लेषण उपलब्ध नहीं है। फसल का विवरण भरकर विश्लेषण चलाएं।',
            soil: 'इस विश्लेषण में मिट्टी की नमी उपलब्ध नहीं है, इसलिए मैं मिट्टी के सूखे होने का अनुमान नहीं लगा सकता। स्थानीय कृषि विशेषज्ञ से सलाह लें।',
            riskHigh: `वर्तमान जोखिम अधिक है। कटाई में ${values.days} दिन और मात्रा ${values.quantity} किलो है। बिक्री की जल्दी योजना बनाएं और ${values.buyer} से संपर्क करें। यह सामान्य सलाह है, गारंटी नहीं।`,
            riskMedium: `वर्तमान जोखिम मध्यम है। कटाई में ${values.days} दिन और मात्रा ${values.quantity} किलो है। फसल देखें और ${values.buyer} से पहले संपर्क करें।`,
            riskLow: `उपलब्ध जानकारी के अनुसार वर्तमान जोखिम कम है। ${values.days} दिन की कटाई अवधि और ${values.quantity} किलो मात्रा पर नज़र रखें।`,
            action: `1. ${values.crop} खेत की नियमित जांच करें।\n2. ${values.quantity} किलो फसल को ${values.days} दिनों में बिक्री के लिए तैयार करें।\n3. ${values.buyer} से जल्दी संपर्क करें।\n4. रसायन, खाद या सिंचाई के लिए कृषि विशेषज्ञ से सलाह लें।`,
            result: `${values.location} में ${values.crop} की मात्रा ${values.quantity} किलो है और कटाई में ${values.days} दिन हैं। खरीदार: ${values.buyer}। जोखिम: ${values.risk}।`,
            crop: `यह विश्लेषण ${values.crop} के लिए है। दूसरी फसल क्यों चुनी गई, इसकी अलग जानकारी वेबसाइट पर नहीं है।`,
            weather: 'इस वेबसाइट से लाइव मौसम की जानकारी जुड़ी नहीं है। खेत या परिवहन का निर्णय लेने से पहले विश्वसनीय स्थानीय मौसम सेवा देखें।',
            price: 'इस वेबसाइट से लाइव बाजार भाव जुड़ा नहीं है। मैं कीमत नहीं गढ़ सकता। स्थानीय बाजार या अनुशंसित खरीदार से पुष्टि करें।',
            transport: `परिवहन अनुमान: लगभग ${values.distance} किमी, ${values.hours} घंटे और INR ${values.cost}। बेहतर विकल्प: ${values.method}। यह केवल अनुमान है।`,
            market: `वर्तमान अनुशंसित खरीदार: ${values.buyer}। अनुमानित बाजार: ${values.market}। उपलब्धता और बाजार समय की पहले पुष्टि करें।`,
            generic: 'अपनी फसल, जोखिम, खरीदार, बाजार या परिवहन अनुमान के बारे में पूछें।',
            status: 'स्थिति: वेबसाइट के विश्लेषण पर आधारित; परिवहन, बाजार, मौसम और कीमत की जानकारी अनुमानित हो सकती है।'
        }
    };
    return messages[selectedAssistantLanguage][key];
}

function createAssistantResponse(question) {
    if (!currentAnalysis) {
        return assistantLanguageText('noAnalysis');
    }

    const { crop, quantity, location, harvestDays, recommendedBuyer, risk } = currentAnalysis;
    const lowerQuestion = question.toLowerCase();
    const missingValues = [];

    if (!crop || crop === 'N/A') {
        missingValues.push('crop');
    }
    if (!location || location === 'N/A') {
        missingValues.push('location');
    }
    if (!quantity || quantity === '0') {
        missingValues.push('quantity');
    }
    if (!harvestDays || harvestDays === '0') {
        missingValues.push('harvest window');
    }

    if (missingValues.length > 0) {
        return assistantLanguageText('missing', { missing: missingValues.join(', ') });
    }

    if (lowerQuestion.includes('soil moisture') || lowerQuestion.includes('soil')) {
        return assistantLanguageText('soil');
    }

    if (lowerQuestion.includes('weather') || lowerQuestion.includes('rain')) {
        return assistantLanguageText('weather');
    }

    if (lowerQuestion.includes('price') || lowerQuestion.includes('market price')) {
        return assistantLanguageText('price');
    }

    if (lowerQuestion.includes('transport') || lowerQuestion.includes('distance') || lowerQuestion.includes('travel') || lowerQuestion.includes('cost')) {
        const estimate = currentAnalysis.transportEstimate || getTransportationEstimate(crop, quantity, location, recommendedBuyer);
        return assistantLanguageText('transport', { distance: estimate.market.distanceKm, hours: estimate.travelHours, cost: estimate.estimatedCost, method: estimate.method.name });
    }

    if (lowerQuestion.includes('market') || lowerQuestion.includes('buyer')) {
        const estimate = currentAnalysis.transportEstimate || getTransportationEstimate(crop, quantity, location, recommendedBuyer);
        return `Recommended Market: ${estimate.market.name}
Market Location: ${estimate.market.address}
Distance: Estimated ${estimate.market.distanceKm} km
Estimated Time: ${estimate.travelHours} hour${estimate.travelHours === 1 ? '' : 's'}
Recommended Transport: ${estimate.method.name}
Recommended Route: ${estimate.route}
Market Contact: Unavailable because no verified market contact source is connected.
Information status: Market route and transport values are estimates; verify market hours, buyer availability, and contact details locally.`;
    }

    if (lowerQuestion.includes('risk') || lowerQuestion.includes('danger')) {
        if (risk === 'High') {
            return assistantLanguageText('riskHigh', { days: harvestDays, quantity, buyer: recommendedBuyer });
        }
        if (risk === 'Medium') {
            return assistantLanguageText('riskMedium', { days: harvestDays, quantity, buyer: recommendedBuyer });
        }
        return assistantLanguageText('riskLow', { days: harvestDays, quantity, buyer: recommendedBuyer });
    }

    if (lowerQuestion.includes('why') && lowerQuestion.includes('crop')) {
        return assistantLanguageText('crop', { crop, buyer: recommendedBuyer });
    }

    if (lowerQuestion.includes('reduce') || lowerQuestion.includes('what should') || lowerQuestion.includes('do now')) {
        return assistantLanguageText('action', { crop, quantity, days: harvestDays, buyer: recommendedBuyer, location });
    }

    return assistantLanguageText('result', { crop, location, quantity, days: harvestDays, buyer: recommendedBuyer, risk });
}

function getTransportFormEstimate(start, destination, crop, quantity, availableVehicle) {
    const destinationName = destination.toLowerCase();
    let distanceKm = 50;
    if (destinationName.includes('yeshwanthpur') || destinationName.includes('bangalore') || destinationName.includes('bengaluru')) {
        distanceKm = 25;
    } else if (destinationName.includes('mysore') || destinationName.includes('mysuru')) {
        distanceKm = 20;
    }

    const automaticMethod = getTransportationMethod(crop, quantity, distanceKm).name;
    const vehicleNames = {
        truck: 'Truck',
        'mini-truck': 'Mini Truck',
        tractor: 'Tractor/Trolley',
        van: 'Van'
    };
    const recommendedTransport = availableVehicle === 'auto' ? automaticMethod : vehicleNames[availableVehicle];
    const travelHours = Math.max(1, Math.ceil(distanceKm / 35));
    const estimatedCost = Math.round(900 + distanceKm * 18 + Number(quantity) * 0.35);

    return { start, destination, crop, quantity, distanceKm, travelHours, estimatedCost, recommendedTransport };
}

function displayTransportFormResult(estimate) {
    const result = document.getElementById('transport-ai-result');
    if (!result) {
        return;
    }

    result.innerHTML = `
        <div class="ai-card">
            <strong>Transportation Estimate</strong>
            <p><strong>Distance:</strong> Estimated ${estimate.distanceKm} km</p>
            <p><strong>Time:</strong> Estimated ${estimate.travelHours} hour${estimate.travelHours === 1 ? '' : 's'}</p>
            <p><strong>Cost:</strong> Estimated INR ${estimate.estimatedCost}</p>
            <p><strong>Best Option:</strong> ${estimate.recommendedTransport}</p>
            <p><strong>Route:</strong> ${estimate.start} to ${estimate.destination} (estimated route)</p>
            <p><strong>Status:</strong> Estimated. No live route, traffic, market, or transport-provider data is connected.</p>
        </div>
    `;
}

function useFarmerLocation() {
    const locationInput = document.getElementById('transport-start');
    if (!locationInput) {
        return;
    }

    if (!navigator.geolocation) {
        addAssistantMessage('Location is not available in this browser. Please enter your starting location manually.', 'assistant');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            locationInput.value = `GPS ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`;
        },
        () => {
            addAssistantMessage('I could not access your location. Please enter the starting location manually.', 'assistant');
        }
    );
}

function startVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const input = document.getElementById('ai-question');
    if (!SpeechRecognition || !input) {
        addAssistantMessage('Voice input is not supported in this browser. Please type your question instead.', 'assistant');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = selectedAssistantLanguage === 'kn' ? 'kn-IN' : selectedAssistantLanguage === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
        const result = event.results[0][0];
        input.value = result.transcript;
        if (typeof result.confidence === 'number' && result.confidence < 0.55) {
            addAssistantMessage('I am not fully sure I heard that. Please check the text and submit it again.', 'assistant');
        }
    };
    recognition.onerror = () => {
        addAssistantMessage('Sorry, I could not understand the voice question. Please repeat it or type it.', 'assistant');
    };
    recognition.start();
}

function askAssistant(question) {
    const cleanedQuestion = question.trim();
    if (!cleanedQuestion) {
        return;
    }

    addAssistantMessage(cleanedQuestion, 'user');
    addAssistantMessage('Checking your analysis...', 'assistant');

    setTimeout(() => {
        const messages = document.getElementById('ai-messages');
        const loadingMessage = messages?.lastElementChild;
        if (loadingMessage) {
            loadingMessage.textContent = createAssistantResponse(cleanedQuestion);
        }
        addAssistantMessage(assistantLanguageText('status'), 'assistant');
    }, 500);
}

function performLogin(event) {
    event.preventDefault();

    const username = document.getElementById('username')?.value.trim();
    const password = document.getElementById('password')?.value.trim();

    if (!username || !password) {
        alert('Please enter both username and password.');
        return;
    }

    const users = getUsers();
    const matchingUser = users.find((user) => user.username === username && user.password === password);

    if (!matchingUser) {
        alert('Account not found. Please create a new account first.');
        setSectionVisibility('signup');
        return;
    }

    sessionStorage.setItem('isLoggedIn', 'true');
    alert('Login successful!');
    syncView();
    document.getElementById('login-form')?.reset();
}

function performSignup(event) {
    event.preventDefault();

    const username = document.getElementById('new-username')?.value.trim();
    const password = document.getElementById('new-password')?.value.trim();
    const confirmPassword = document.getElementById('confirm-password')?.value.trim();

    if (!username || !password || !confirmPassword) {
        alert('Please complete all fields.');
        return;
    }

    if (password.length < 4) {
        alert('Password must be at least 4 characters long.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match.');
        return;
    }

    const users = getUsers();
    const userExists = users.some((user) => user.username === username);

    if (userExists) {
        alert('This username already exists. Please log in or choose another name.');
        return;
    }

    users.push({ username, password });
    saveUsers(users);

    sessionStorage.setItem('isLoggedIn', 'true');
    alert('Account created successfully!');
    document.getElementById('signup-form')?.reset();
    syncView();
}

function logout() {
    sessionStorage.setItem('isLoggedIn', 'false');
    syncView();
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const farmerForm = document.getElementById('farmer-form');
    const loginLink = document.getElementById('login-link');
    const getStartedButton = document.getElementById('get-started-btn');
    const newAnalysisButton = document.getElementById('new-analysis-btn');
    const showSignupButton = document.getElementById('show-signup-btn');
    const showLoginButton = document.getElementById('show-login-btn');
    const assistantToggle = document.getElementById('ai-assistant-toggle');
    const assistantPanel = document.getElementById('ai-assistant');
    const assistantForm = document.getElementById('ai-form');
    const assistantQuestion = document.getElementById('ai-question');
    const quickQuestions = document.querySelectorAll('.ai-question-btn');
    const assistantLanguage = document.getElementById('ai-language');
    const voiceButton = document.getElementById('ai-voice-btn');
    const transportForm = document.getElementById('transport-form');
    const useLocationButton = document.getElementById('use-location-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', performLogin);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', performSignup);
    }

    if (farmerForm) {
        farmerForm.addEventListener('submit', analyze);
    }

    if (loginLink) {
        loginLink.addEventListener('click', (event) => {
            if (isLoggedIn()) {
                event.preventDefault();
                logout();
            }
        });
    }

    if (getStartedButton) {
        getStartedButton.addEventListener('click', goToFarmerInput);
    }

    if (newAnalysisButton) {
        newAnalysisButton.addEventListener('click', () => {
            setSectionVisibility('farmer-input');
        });
    }

    if (showSignupButton) {
        showSignupButton.addEventListener('click', () => {
            setSectionVisibility('signup');
        });
    }

    if (showLoginButton) {
        showLoginButton.addEventListener('click', () => {
            setSectionVisibility('login');
        });
    }

    if (assistantToggle && assistantPanel) {
        assistantToggle.addEventListener('click', () => {
            const isHidden = assistantPanel.hidden;
            assistantPanel.hidden = !isHidden;
            assistantToggle.setAttribute('aria-expanded', String(isHidden));
            if (isHidden) {
                assistantQuestion?.focus();
            }
        });
    }

    if (assistantForm && assistantQuestion) {
        assistantForm.addEventListener('submit', (event) => {
            event.preventDefault();
            askAssistant(assistantQuestion.value);
            assistantQuestion.value = '';
        });
    }

    quickQuestions.forEach((button) => {
        button.addEventListener('click', () => {
            askAssistant(button.dataset.question || 'Explain my result');
        });
    });

    if (assistantLanguage) {
        assistantLanguage.addEventListener('change', () => {
            selectedAssistantLanguage = assistantLanguage.value;
        });
    }

    if (voiceButton) {
        voiceButton.addEventListener('click', startVoiceInput);
    }

    if (useLocationButton) {
        useLocationButton.addEventListener('click', useFarmerLocation);
    }

    if (transportForm) {
        transportForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const start = document.getElementById('transport-start')?.value.trim();
            const destination = document.getElementById('transport-destination')?.value.trim();
            const crop = document.getElementById('transport-crop')?.value.trim();
            const quantity = document.getElementById('transport-quantity')?.value;
            const availableVehicle = document.getElementById('transport-vehicle')?.value || 'auto';
            const missing = [];
            if (!start) missing.push('starting location');
            if (!destination) missing.push('destination or market');
            if (!crop) missing.push('crop');
            if (!quantity || Number(quantity) <= 0) missing.push('quantity');
            if (missing.length > 0) {
                displayTransportFormResult({
                    start: 'More information needed',
                    destination: missing.join(', '),
                    crop: '',
                    quantity: '',
                    distanceKm: 'Not available',
                    travelHours: 'Not available',
                    estimatedCost: 'Not available',
                    recommendedTransport: 'Please provide the missing details'
                });
                return;
            }
            displayTransportFormResult(getTransportFormEstimate(start, destination, crop, quantity, availableVehicle));
        });
    }

    syncView();
});
