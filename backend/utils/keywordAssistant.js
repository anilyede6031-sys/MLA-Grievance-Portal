/**
 * Daund Vikas Mitra - Resilient Keyword Assistant
 * Provides fallback responses using local DB data when AI models fail.
 */
function getKeywordResponse(message, data) {
  const msg = message.toLowerCase();
  const { projects = [], stats = {}, history = [] } = data;

  // Basic Memory: Check if we just asked for a village
  const lastBotMsg = history.length > 0 ? (history[history.length - 1].text || '').toLowerCase() : '';
  const askedForVillage = lastBotMsg && (lastBotMsg.includes('गावाचे नाव') || lastBotMsg.includes('village name'));

  // 1. Complaint Status & Inquiries
  if (msg.includes('complaint') || msg.includes('tarkrar') || msg.includes('तक्रार') || msg.includes('ग्रिव्हन्स') || msg.includes('अडचण') || msg.match(/dk-\d{4}-\d{5}/i) || msg.match(/grv-[a-z0-0-]+/i)) {
    const idMatch = msg.match(/dk-\d{4}-\d{5}/i) || msg.match(/grv-[a-z0-9-]+/i);
    if (idMatch || msg.includes('status') || msg.includes('check') || msg.includes('track') || msg.includes('कधी') || msg.includes('स्थिती')) {
      const idStr = idMatch ? ` (ID: ${idMatch[0].toUpperCase()})` : '';
      return `आपल्या तक्रारीची स्थिती${idStr} जाणून घेण्यासाठी कृपया वर दिलेल्या 'Track' बटणावर क्लिक करा आणि आपला तक्रार क्रमांक टाइप करा. (To check status, use 'Track' button with your GRV ID.)\nवर्तमान आकडेवारी: ${stats.total || 0} एकूण तक्रारी, ${stats.resolved || 0} पूर्ण.`;
    }
    return `तक्रार नोंदवण्यासाठी कृपया मुख्य पानावर असलेल्या 'File Complaint' बटणावर क्लिक करा. आपण तिथे फोटो आणि लोकेशन देखील देऊ शकता. (To file a complaint, click 'File Complaint' on the home page.)`;
  }

  // 2. Project & Development Inquiries
  if (msg.includes('project') || msg.includes('development') || msg.includes('प्रकल्प') || msg.includes('विकास') || msg.includes('काम') || msg.includes('बजेट')) {
    const list = projects.length > 0 
      ? projects.slice(0, 4).map(p => `- ${p.name} (बजेट: ₹${p.budget} कोटी, स्थिती: ${p.status})`).join('\n')
      : "सध्या काही प्रकल्पांची यादी उपलब्ध नाही.";
    return `दौंडमधील चालू विकासकामे:\n${list}\nअधिक माहितीसाठी 'Tracker' विभाग पाहा. (Check the Tracker section for all ${projects.length} projects.)`;
  }

  // 3. MLA & Identity
  if (msg.includes('rahul') || msg.includes('kul') || msg.includes('राहुल') || msg.includes('कुल') || msg.includes('साहेब')) {
    return "आमदार राहुलजी कुल साहेब दौंडच्या सर्वांगीण विकासासाठी कटिबद्ध आहेत. डिजिटल दौंडच्या माध्यमातून ते थेट नागरिकांच्या संपर्कात आहेत. (MLA Rahul Kul is dedicated to Daund's development and is directly connected to citizens.)";
  }

  // 4. Emergency & Contacts
  if (msg.includes('emergency') || msg.includes('contact') || msg.includes('मदत') || msg.includes('संपर्क') || msg.includes('नंबर') || msg.includes('phone')) {
    return `तात्काळ मदतीसाठी 'Emergency' आयकॉनवर क्लिक करा. महत्त्वाचे क्रमांक: \n- पोलीस: १००\n- रुग्णवाहिका: १०२\n- अग्निशमन: १०१\n- संपर्क: १८००-XXX-XXXX`;
  }

  // 5. Water & Filter Issues
  if (msg.includes('pani') || msg.includes('water') || msg.includes('नळ') || msg.includes('पाणी') || msg.includes('filter') || msg.includes('फिल्टर')) {
    if (askedForVillage) return "पाण्याच्या समस्येबद्दल माहिती मिळाली. कृपया आपली अडचण थोडक्यात सांगा किंवा 'File Complaint' वर फोटो पाठवा. (Water issue noted. Please describe briefly or send photos via 'File Complaint'.)";
    return "पाण्याच्या तक्रारीबद्दल आम्हाला समजले. कृपया तुमच्या गावाचे नाव सांगा. (Water issue detected. Please mention your village name.)";
  }

  // 6. Electricity & Light
  if (msg.includes('light') || msg.includes('electricity') || msg.includes('लाईट') || msg.includes('वीज') || msg.includes('power') || msg.includes('विजेचा')) {
    return "वीजपुरवठा खंडित असल्यास किंवा ट्रान्सफॉर्मरची तक्रार असल्यास, कृपया तुमचा ग्राहक नंबर सांगा. आम्ही MSEB सोबत पाठपुरावा करू. (Power issue detected. Please mention your Consumer No.)";
  }

  // 7. Roads & Drainage
  if (msg.includes('road') || msg.includes('rasta') || msg.includes('रस्ता') || msg.includes('खड्डा') || msg.includes('पाऊस') || msg.includes('drainage')) {
    if (askedForVillage) return "रस्त्याची समस्या आम्ही समजलो आहोत. कृपया 'File Complaint' बटण वापरून तक्रार नोंदवा, म्हणजे आम्ही त्यावर काम करू शकू. (Road issue noted. Please use 'File Complaint' to register formally.)";
    return "रस्ते किंवा ड्रेनेज समस्येची दखल घेतली जाईल. कृपया तुमच्या गावाचे नाव सांगा. (Road/Drainage issue. Please mention your village name.)";
  }

  // 8. Locations & Acknowledgments
  if (msg.includes('daund') || msg.includes('दौंड') || msg.includes('गावात') || msg.includes('राहतो') || msg.includes('गाव') || msg.includes('पत्ता')) {
    return "धन्यवाद! आपण सांगितलेले लोकेशन आम्ही नोंदवले आहे. कृपया आपली अडचण थोडक्यात सांगा किंवा 'File Complaint' बटण वापरून फोटो शेअर करा. (Location noted. Please describe your issue briefly or use 'File Complaint'.)";
  }

  // 9. Greetings & Common Phrases
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('gm') || msg.includes('morning') || msg.includes('सकाळ') || msg.includes('नमस्कार') || msg.includes('राम राम') || msg.includes('hey') || msg.includes('ok') || msg.includes('ठीक') || msg.includes('हो') || msg.includes('help') || msg.includes('कोण') || msg.includes('कोणती') || msg.includes('night') || msg.includes('gn') || msg.includes('रात्री') || msg.includes('shubh')) {
    // Language/Identity Keywords
    if (msg.includes('hinglish') || msg.includes('english')) {
        return "नक्कीच! मी आतापासून Hinglish/English मध्ये देखील संवाद साधू शकतो. सांगा, मी तुमची काय मदत करू? (Sure! I can communicate in Hinglish/English too. How can I help you?)";
    }
    if (msg.includes('marathi') || msg.includes('मराठी')) {
        return "हो, मी मराठीतच बोलणार आहे. सांगा, तुमची काय समस्या आहे? (Yes, I will speak in Marathi. What is your issue?)";
    }
    if (msg.includes('कोण आहे') || msg.includes('who are you') || msg.includes('tula kay bou')) {
        return "मी आपला 'डिजिटल सेवा प्रतिनिधी' आहे. मी आमदार राहुलजी कुल साहेबांच्या मार्गदर्शनाखाली नागरिकांना मदत करण्यासाठी बनवला गेलो आहे. (I am your Digital Seva Representative, created to assist citizens under MLA Rahul Kul's guidance.)";
    }

    // Default Fallback (Persona check)
    // If we've already sent a greeting, don't just repeat it.
    if (lastBotMsg && (lastBotMsg.includes('कशी मदत करू') || lastBotMsg.includes('How can I help'))) {
        return "मी तुमची समस्या समजून घेण्यास तयार आहे. कृपया तुमची तक्रार सांगा किंवा 'File Complaint' पर्यायावर क्लिक करा. (I'm ready to understand your issue. Please state your complaint or click 'File Complaint'.)";
    }

    return "नमस्कार! मी आपला 'डिजिटल सेवा प्रतिनिधी' आहे. तुम्ही पाठवलेला संदेश मिळाला! मी आपल्याला तक्रार नोंदवण्यासाठी किंवा इतर माहिती देण्यासाठी मदत करू शकतो. मी तुमची कशी मदत करू सांगा? (I am your Digital Seva Representative. How can I help you?)";
  }

  // --- FRUSTRATION TRIGGER (v83) ---
  if (msg.match(/mad|nahi|nit|sangaych|broken|fail|wrong|aswer|cashing/) || (msg.includes('काम') && msg.includes('नाही'))) {
    return "क्षमस्व! तुमची गैरसोय होत असल्याचे आम्हाला समजले. आम्ही सिस्टिम सुधारण्यासाठी सतत काम करत आहोत. कृपया तुमची अडचण थोडक्यात सांगा किंवा 'File Complaint' बटण वापरून फोटो शेअर करा. (We apologize. Please describe your issue briefly or use 'File Complaint' for action.)";
  }

  return null;
}

module.exports = { getKeywordResponse };
