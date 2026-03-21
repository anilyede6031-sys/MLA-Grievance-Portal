/**
 * Daund Vikas Mitra - Resilient Keyword Assistant
 * Provides fallback responses using local DB data when AI models fail.
 */
function getKeywordResponse(message, data) {
  const msg = message.toLowerCase();
  const { projects = [], stats = {} } = data;

  // 1. Complaint Status & Inquiries
  if (msg.includes('complaint') || msg.includes('tarkrar') || msg.includes('तक्रार') || msg.includes('ग्रिव्हन्स') || msg.includes('अडचण')) {
    if (msg.includes('status') || msg.includes('check') || msg.includes('track') || msg.includes('कधी') || msg.includes('स्थिती')) {
      return `आपल्या तक्रारीची स्थिती जाणून घेण्यासाठी कृपया वर दिलेल्या 'Track' बटणावर क्लिक करा आणि आपला तक्रार क्रमांक (GRV-XXXX) टाइप करा. (To check status, use 'Track' button with your GRV ID.)\nवर्तमान आकडेवारी: ${stats.total} एकूण तक्रारी, ${stats.resolved} पूर्ण.`;
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

  // 5. Greetings & Help
  if (msg.includes('hi') || msg.includes('hello') || msg.includes('नमस्कार') || msg.includes('राम राम') || msg.includes('help') || msg.includes('काय') || msg.includes('कोण')) {
    return "नमस्कार! मी 'दौंड डिजिटल सहाय्यक' (Daund Vikas Mitra) आहे. मी आपल्याला विकास प्रकल्पांची माहिती देणे, तक्रार नोंदवण्यास मदत करणे आणि आपत्कालीन संपर्क क्रमांक पुरवणे यामध्ये मदत करू शकतो. मी आपली काय मदत करू?";
  }

  return null; // Fallback to generic error if no keywords match
}

module.exports = { getKeywordResponse };
