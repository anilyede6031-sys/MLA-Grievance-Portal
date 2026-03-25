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

  // 1. STATEFUL SEQUENTIAL FLOW (v84)
  // If LLM fails, we manually drive the 7-step sequence based on history.
  const getUserReplyFor = (botTextPart) => {
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i].role === 'bot' && history[i].text && history[i].text.toLowerCase().includes(botTextPart)) {
        return history[i+1] ? history[i+1].text : null;
      }
    }
    return null;
  };

  if (lastBotMsg.includes('full name') || lastBotMsg.includes('पूर्ण नाव')) {
    return "धन्यवाद! आता कृपया आपला दहा अंकी मोबाईल नंबर सांगा. (Thank you! Now please provide your 10-digit mobile number.)";
  }
  if (lastBotMsg.includes('mobile number') || lastBotMsg.includes('मोबाईल नंबर')) {
    return "उत्तम! आता आपल्या गावाचे किंवा परिसराचे नाव सांगा. (Great! Now tell us your Village or Area name.)";
  }
  if (lastBotMsg.includes('village') || lastBotMsg.includes('area') || lastBotMsg.includes('गावाचे') || lastBotMsg.includes('परिसराचे')) {
    return "समजले. आपली समस्या कोणत्या प्रकारची आहे? (Water, Road, Electricity, or Other) - (Understood. What type of problem is it?)";
  }
  if (lastBotMsg.includes('problem type') || lastBotMsg.includes('समस्या कोणत्या प्रकारची')) {
    return "कृपया आपल्या समस्येचे थोडक्यात वर्णन करा. (Please provide a brief description of your problem.)";
  }
  if (lastBotMsg.includes('brief description') || lastBotMsg.includes('थोडक्यात वर्णन')) {
    return "मी सर्व माहिती नोंदवली आहे. एकदा तपासा: [माहिती]. ही माहिती बरोबर आहे का? (I've noted the details. Is this information correct? Reply with 'Yes'.)";
  }
  if (lastBotMsg.includes('बरोबर आहे का') || lastBotMsg.includes('information correct')) {
    if (msg.includes('yes') || msg.includes('हो') || msg.includes('बरोबर')) {
        const id = `DK-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
        return `तुमची तक्रार यशस्वीरित्या नोंदवण्यात आली आहे! तुमचा तक्रार क्रमांक: ${id}. आम्ही लवकरच आपल्याशी संपर्क करू. (Your complaint is registered! Ticket ID: ${id}. We will contact you soon.) $$$COMPLAINT_DATA:{"id":"${id}"}###`;
    }
  }

  // Initial Trigger for the flow
  if (msg.includes('complaint') || msg.includes('tarkrar') || msg.includes('तक्रार') || msg.includes('नोंद')) {
     if (msg.includes('status') || msg.includes('check') || msg.match(/dk-\d{4}-\d{5}/i) || msg.match(/grv-[a-z0-9-]+/i)) {
       const idMatch = msg.match(/dk-\d{4}-\d{5}/i) || msg.match(/grv-[a-z0-9-]+/i);
       const idStr = idMatch ? ` (ID: ${idMatch[0].toUpperCase()})` : '';
       return `तक्रारीची स्थिती${idStr} पाहण्यासाठी 'Track' बटण वापरा. (Use 'Track' for status.)`;
     }
     return "नक्कीच! तुमची तक्रार नोंदवण्यासाठी, कृपया तुमचे पूर्ण नाव सांगा. (Sure! To register your complaint, please tell us your Full Name.)";
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

  // 9. Navigation & Auth (v86)
  if (msg.includes('login') || msg.includes('sign in') || msg.includes('लॉगिन') || msg.includes('अकाउंट')) {
    return "आपल्या अकाउंटमध्ये 'Login' करण्यासाठी वरच्या उजव्या कोपऱ्यातील 'Login' बटण वापरा. जर आपण नवीन असाल, तर 'Sign Up' करून नोंदणी करा. (To Login, use the button in the top-right corner. Use 'Sign Up' if you are new.)";
  }
  if (msg.includes('track') || msg.includes('trak') || msg.includes('स्थिती') || msg.includes('check status')) {
    return "तुमची तक्रार ट्रॅक करण्यासाठी 'Track Complaint' विभाग वापरा किंवा तुमचा 'DK-' नंबर मला सांगा. (Use 'Track Complaint' section or tell me your 'DK-' number to check status.)";
  }

  // 10. MLA Appointments & Office
  if (msg.includes('office') || msg.includes('bhet') || msg.includes('meet') || msg.includes('appointment') || msg.includes('भेट') || msg.includes('पत्ता')) {
    return "आमदार राहुलजी कुल साहेबांचे जनसंपर्क कार्यालय दौंड रेल्वे स्टेशन समोर आहे. आपण सकाळी १० ते २ या वेळेत कार्यालयाला भेट देऊ शकता. (MLA Rahul Kul's office is opposite Daund Railway Station. Visiting hours: 10 AM to 2 PM.)";
  }

  // 11. Local Utilities (Market/Transport)
  if (msg.includes('bus') || msg.includes('st') || msg.includes('timing') || msg.includes('एसटी') || msg.includes('गाडी')) {
    return "दौंड एसटी डेपोचे वेळापत्रक पाहण्यासाठी आपण डेपोच्या चौकशी खिडकीवर संपर्क साधू शकता किंवा अधिकृत एमएसआरटीसी ॲप चेक करू शकता. (Check MSRTC app or visit Daund ST Depot for latest timings.)";
  }
  if (msg.includes('market') || msg.includes('bajar') || msg.includes('दर') || msg.includes('rate') || msg.includes('भाव')) {
    return "दौंड कृषी उत्पन्न बाजार समितीचे आजचे बाजारभाव 'Agriculture' विभागात किंवा समितीच्या नोटीस बोर्डवर उपलब्ध आहेत. (Check today's market rates in the 'Agriculture' section or on the APMC notice board.)";
  }

  // 12. Government Schemes & Help
  if (msg.includes('ration') || msg.includes('रेशन') || msg.includes('card') || msg.includes('card')) {
    return "नवीन रेशन कार्ड किंवा बदलांसाठी तहसील कार्यालयातील 'पुरवठा विभाग' (Supply Dept) ला भेट द्या. (Visit the Supply Dept at Tahsil office for Ration Card services.)";
  }
  if (msg.includes('pension') || msg.includes('पेन्शन') || msg.includes('योजना') || msg.includes('scheme')) {
    return "श्रावणबाळ किंवा संजय गांधी निराधार योजनेच्या माहितीसाठी जवळील 'सेतू केंद्रा'ला (Setu Kendra) भेट द्या. (Visit nearest Setu Kendra for Shravanbal or Sanjay Gandhi Pension scheme info.)";
  }

  // 13. System & Fun
  if (msg.includes('who made you') || msg.includes('developer') || msg.includes('सिस्टम') || msg.includes('बनवले')) {
    return "मला डीजीटल दौंडच्या (Digital Daund) टीमने आमदार राहुल कुल साहेबांच्या मार्गदर्शनाखाली तयार केले आहे. (I am created by the Digital Daund team under MLA Rahul Kul's guidance.)";
  }
  if (msg.includes('joke') || msg.includes('विशाल') || msg.includes('विनोद')) {
    return "एक छोटा विनोद: रस्ता इतका गुळगुळीत झाला आहे की गाडी चालवताना टायरला फक्त आरसा बघायचा बाकी आहे! 😄 (Just a small joke: The roads are so smooth now that tires only need a mirror to see themselves!)";
  }

  // 14. Greetings & Common Phrases
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('gm') || msg.includes('morning') || msg.includes('सकाळ') || msg.includes('नमस्कार') || msg.includes('राम राम') || msg.includes('hey') || msg.includes('ok') || msg.includes('ठीक') || msg.includes('हो') || msg.includes('help') || msg.includes('night') || msg.includes('gn') || msg.includes('रात्री') || msg.includes('shubh')) {
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
