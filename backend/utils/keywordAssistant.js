/**
 * Daund Vikas Mitra - Resilient Keyword Assistant
 * Provides fallback responses using local DB data when AI models fail.
 */
function getKeywordResponse(message, data) {
  const msg = message.toLowerCase();
  const { projects = [], stats = {} } = data;

  // 1. Complaint Status Inquiries
  if (msg.includes('complaint') || msg.includes('tarkrar') || msg.includes('ग्रिव्हन्स')) {
    if (msg.includes('status') || msg.includes('check') || msg.includes('track')) {
      return `आपली तक्रार शोधण्यासाठी कृपया वर दिलेल्या 'Track' टॅबचा वापर करा. सध्या आमच्याकडे ${stats.total} तक्रारी आहेत, त्यापैकी ${stats.resolved} पूर्ण झाल्या आहेत. (To track your complaint, please use the 'Track' tab. We have ${stats.total} total complaints.)`;
    }
    return `तक्रार नोंदवण्यासाठी कृपया मुख्य पानावर असलेल्या 'File Complaint' बटणावर क्लिक करा. (To file a complaint, please click 'File Complaint' on the home page.)`;
  }

  // 2. Project Inquiries
  if (msg.includes('project') || msg.includes('development') || msg.includes('प्रकल्प') || msg.includes('काम')) {
    const list = projects.slice(0, 3).map(p => `- ${p.name} (${p.status})`).join('\n');
    return `दौंडमधील काही महत्त्वाचे प्रकल्प:\n${list}\nअधिक माहितीसाठी 'Tracker' विभाग पाहा. (Here are some key projects in Daund. For more, visit the Tracker section.)`;
  }

  // 3. Emergency
  if (msg.includes('emergency') || msg.includes('contact') || msg.includes('मदत') || msg.includes('संपर्क')) {
    return `आपत्कालीन मदतीसाठी कृपया 'Emergency' बटण दाबा किंवा १०० (पोलीस), १०१ (अग्निशमन) वर संपर्क साधा. (For emergency help, call 100 or 101, or click the Emergency icon.)`;
  }

  // 4. Greetings
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('नमस्कार') || msg.includes('राम राम')) {
    return "नमस्कार! मी आपला दौंड डिजिटल सहाय्यक आहे. मी आपल्याला विकास प्रकल्प किंवा तक्रारींबद्दल माहिती देऊ शकतो. (Hello! I am your Daund Digital Assistant. I can help with projects or complaints.)";
  }

  return null; // Fallback to generic error if no keywords match
}

module.exports = { getKeywordResponse };
