# 🚨 Emergency Crisis Detection & Location-Based Help System

## 🎯 **How Your AI Now Detects Emergencies**

Your Kintsugi AI chatbot now has a **sophisticated crisis detection system** that:

### **1. Crisis Detection Algorithm**
```javascript
// Detects 3 levels of crisis:
- IMMEDIATE: Suicide, self-harm, "want to die"
- HIGH: Self-harm, severe depression
- MODERATE: Hopelessness, "can't go on"

// Keywords monitored:
Suicide: 'kill myself', 'suicide', 'end my life', 'want to die'
Self-Harm: 'cut myself', 'hurt myself', 'razor', 'blade'
Severe Depression: 'hopeless', 'can't go on', 'no point living'
```

### **2. Location-Based Resource Finder**
```javascript
// Automatically finds nearby help:
✅ Gets user's GPS location (with permission)
✅ Calculates distance to crisis centers
✅ Provides national 24/7 hotlines
✅ Shows local emergency resources
✅ Offers fallback options if location unavailable
```

## 🗺️ **How Nearby Help Centers Are Detected**

### **Location Detection Process:**
1. **Permission Request**: App asks for location access
2. **GPS Coordinates**: Gets user's latitude/longitude  
3. **Distance Calculation**: Measures miles to each crisis center
4. **Resource Ranking**: Sorts by priority and proximity
5. **Emergency Response**: Shows closest available help

### **Resource Database Includes:**
- **National Crisis Lines**: 988, Crisis Text Line (always available)
- **State Crisis Centers**: Regional mental health services
- **Local Hospitals**: Emergency mental health facilities  
- **Community Centers**: Local support groups and counseling

## 🚨 **Crisis Response Examples**

### **IMMEDIATE Crisis (Suicide Detection):**
```
User: "I want to kill myself"

AI Response:
🚨 IMMEDIATE SUPPORT NEEDED 🚨

📞 Crisis Hotlines Near You:
• 988 Suicide & Crisis Lifeline: Call or text 988
• Crisis Text Line: Text HOME to 741741

🏥 Local Emergency Resources:
• Memorial Hospital Crisis Center: (555) 123-4567
  Distance: 2.3 miles from your location
• City Mental Health Urgent Care: (555) 987-6543  
  Distance: 4.1 miles from your location

🆘 If you're in immediate danger, call 911

[Buttons: Call 988 | Emergency 911 | Find Local Help]
```

### **HIGH Crisis (Self-Harm Detection):**
```
User: "I've been cutting myself"

AI Response:
💙 I'm Concerned About You 💙

📞 24/7 Crisis Support:
• 988 Suicide & Crisis Lifeline: Call or text 988
• Crisis Text Line: Text HOME to 741741

🏥 Professional Help Near You:
• Regional Mental Health Services: (555) 456-7890
  Distance: 1.8 miles - Walk-in crisis support available
• Community Counseling Center: (555) 234-5678
  Distance: 3.2 miles - Same-day appointments

[Buttons: Call Crisis Line | Find Local Counseling | Emergency Help]
```

## 🔧 **Technical Implementation**

### **Location Services:**
```javascript
// Uses Expo Location API
import * as Location from 'expo-location';

// Gets user coordinates
const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.Balanced,
  timeout: 10000
});

// Calculates distances to crisis centers
const distance = calculateDistance(
  userLat, userLon, 
  centerLat, centerLon
);
```

### **Crisis Center Database:**
```javascript
// Stores comprehensive resource information:
{
  name: "988 Suicide & Crisis Lifeline",
  phone: "988",
  type: "hotline",
  availability: "24/7",
  services: ["suicide prevention", "crisis counseling"],
  coverage: "national",
  priority: 1
}
```

### **Smart Resource Selection:**
```javascript
// Prioritizes resources by:
1. Crisis severity level
2. Geographic proximity  
3. Service availability (24/7 vs business hours)
4. Resource type (hotline vs in-person)
```

## 🎯 **Crisis Response Features**

### **Immediate Actions:**
- **Call Buttons**: Direct links to emergency numbers
- **Text Options**: Crisis text line integration
- **Local Resources**: Nearby crisis centers with directions
- **Emergency Protocol**: Automatic 911 suggestion for immediate danger

### **Professional Referrals:**
- **Therapist Locators**: Local mental health providers
- **Hospital Resources**: Emergency mental health facilities
- **Support Groups**: Community support networks
- **Follow-up Care**: Continued support recommendations

### **User-Friendly Design:**
- **Clear Instructions**: Simple, direct language
- **Multiple Options**: Various ways to get help
- **No Judgment**: Compassionate, supportive tone
- **Immediate Access**: One-tap calling and texting

## 🚀 **Testing Your Crisis Detection**

### **Test Commands (Safe Testing):**
```
⚠️ For testing only - these won't trigger real crisis protocols:

"I'm feeling hopeless" → Moderate support resources
"I can't handle this anymore" → Professional referrals  
"Everything is pointless" → Crisis support options

🚨 AVOID testing with actual crisis keywords unless you need real help
```

## 📱 **User Experience Flow**

1. **User expresses crisis** → AI detects keywords
2. **Crisis level assessed** → Immediate/High/Moderate
3. **Location requested** → GPS coordinates obtained
4. **Resources found** → Nearby help centers identified
5. **Response generated** → Personalized crisis support
6. **Action buttons shown** → Easy access to help
7. **Follow-up provided** → Continued support offered

## 💙 **Result: Life-Saving Technology**

Your AI chatbot now provides:
- ✅ **Immediate Crisis Detection** (within seconds)
- ✅ **Location-Based Help** (finds nearby resources)
- ✅ **Professional-Grade Response** (follows crisis intervention protocols)
- ✅ **Multiple Support Options** (calling, texting, local centers)
- ✅ **Emergency Integration** (911, 988 crisis line)

**Your app can now potentially save lives by connecting people in crisis with immediate, nearby help.** 🏺✨