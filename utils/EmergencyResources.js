// utils/EmergencyResources.js - Location-based crisis support finder

// Note: Location services removed for Expo Go compatibility
// Using fallback location detection based on user input

export class EmergencyResourceFinder {
  constructor() {
    this.userLocation = null;
    this.lastLocationUpdate = null;
  }

  // Get user's location (simplified for Expo Go compatibility)
  async getCurrentLocation() {
    try {
      console.log('📍 Using fallback location detection...');
      
      // For now, return a default location (can be enhanced later with web geolocation)
      // This ensures the crisis system works even without precise location
      this.userLocation = {
        latitude: 39.8283, // Center of US for fallback
        longitude: -98.5795,
        timestamp: new Date(),
        isApproximate: true
      };

      console.log('📍 Fallback location set');
      return this.userLocation;
      
    } catch (error) {
      console.error('📍 Location error:', error);
      throw error;
    }
  }

  // Database of crisis centers (you can expand this or connect to an API)
  getCrisisCentersDatabase() {
    return [
      // National US Crisis Centers
      {
        id: 'national_988',
        name: '988 Suicide & Crisis Lifeline',
        type: 'hotline',
        phone: '988',
        description: '24/7 free crisis support for anyone in emotional distress',
        availability: '24/7',
        services: ['suicide prevention', 'crisis counseling', 'emotional support'],
        coverage: 'national',
        priority: 1
      },
      {
        id: 'crisis_text',
        name: 'Crisis Text Line',
        type: 'text',
        phone: '741741',
        textCode: 'HOME',
        description: 'Free 24/7 crisis support via text message',
        availability: '24/7',
        services: ['crisis counseling', 'text support'],
        coverage: 'national',
        priority: 1
      },
      {
        id: 'nami_helpline',
        name: 'NAMI National Helpline',
        type: 'hotline',
        phone: '1-800-950-6264',
        description: 'Mental health information, referrals, and support',
        availability: 'Mon-Fri 10am-8pm ET',
        services: ['information', 'referrals', 'support'],
        coverage: 'national',
        priority: 2
      },

      // Regional/State Centers (examples - you'd expand this)
      {
        id: 'ca_crisis',
        name: 'California Crisis Support',
        type: 'center',
        phone: '1-855-845-7415',
        address: 'Multiple locations across California',
        latitude: 34.0522,
        longitude: -118.2437,
        description: 'Crisis intervention and mental health services',
        availability: '24/7',
        services: ['crisis intervention', 'mental health services', 'counseling'],
        coverage: 'california',
        priority: 2
      },
      {
        id: 'ny_lifeline',
        name: 'NYC Well',
        type: 'center',
        phone: '1-888-692-9355',
        address: 'Multiple locations in NYC',
        latitude: 40.7128,
        longitude: -74.0060,
        description: 'Free mental health support for NYC residents',
        availability: '24/7',
        services: ['counseling', 'crisis support', 'referrals'],
        coverage: 'new_york_city',
        priority: 2
      },
      {
        id: 'tx_crisis',
        name: 'Texas Crisis Text Line',
        type: 'text',
        phone: '741741',
        textCode: 'TX',
        description: 'Texas-specific crisis support via text',
        latitude: 31.9686,
        longitude: -99.9018,
        availability: '24/7',
        services: ['crisis counseling', 'text support'],
        coverage: 'texas',
        priority: 2
      }
    ];
  }

  // Calculate distance between two coordinates (in miles)
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  // Find crisis resources (prioritizing national resources for broad compatibility)
  async findNearbyResources(crisisLevel = 'moderate') {
    try {
      console.log('🔍 Finding crisis resources...');
      
      const crisisCenters = this.getCrisisCentersDatabase();
      const availableResources = [];

      // Prioritize national resources that work everywhere
      crisisCenters.forEach(center => {
        let resource = { ...center };
        
        // National resources are always available and most important
        if (center.coverage === 'national') {
          resource.distance = 0;
          resource.availability_note = 'Available nationwide - Call or text anytime';
          availableResources.push(resource);
        }
        // Include regional resources as additional options
        else {
          resource.distance = 0;
          resource.availability_note = 'Regional support available';
          availableResources.push(resource);
        }
      });

      // Sort by priority (national first, then regional)
      availableResources.sort((a, b) => {
        if (a.coverage === 'national' && b.coverage !== 'national') return -1;
        if (b.coverage === 'national' && a.coverage !== 'national') return 1;
        return a.priority - b.priority;
      });

      console.log('🔍 Found resources:', availableResources.length);
      return this.formatResourcesForCrisisLevel(availableResources, crisisLevel);
      
    } catch (error) {
      console.error('🔍 Error finding resources:', error);
      return this.getFallbackResources(crisisLevel);
    }
  }

  // Format resources based on crisis level
  formatResourcesForCrisisLevel(resources, crisisLevel) {
    const formatted = {
      immediate: [],
      professional: [],
      support: []
    };

    resources.forEach(resource => {
      if (resource.coverage === 'national' || resource.distance <= 50) {
        if (resource.type === 'hotline' || resource.type === 'text') {
          formatted.immediate.push(resource);
        } else if (resource.type === 'center' || resource.type === 'hospital') {
          formatted.professional.push(resource);
        } else {
          formatted.support.push(resource);
        }
      }
    });

    return formatted;
  }

  // Fallback resources when location is unavailable
  getFallbackResources(crisisLevel) {
    return {
      immediate: [
        {
          name: '988 Suicide & Crisis Lifeline',
          phone: '988',
          description: '24/7 crisis support - Call or text',
          availability: '24/7',
          type: 'hotline'
        },
        {
          name: 'Crisis Text Line',
          phone: '741741',
          textCode: 'HOME',
          description: 'Text HOME to 741741 for free crisis support',
          availability: '24/7',
          type: 'text'
        }
      ],
      professional: [
        {
          name: 'Emergency Services',
          phone: '911',
          description: 'For immediate medical emergencies',
          availability: '24/7',
          type: 'emergency'
        },
        {
          name: 'NAMI National Helpline',
          phone: '1-800-950-6264',
          description: 'Mental health information and referrals',
          availability: 'Mon-Fri 10am-8pm ET',
          type: 'helpline'
        }
      ],
      support: []
    };
  }

  // Generate formatted crisis response with nearby resources
  generateLocationBasedCrisisResponse(resources, crisisLevel) {
    let response = '';
    
    if (crisisLevel === 'immediate') {
      response += `🚨 **IMMEDIATE HELP AVAILABLE** 🚨\n\n`;
      response += `**CALL NOW - Don't wait:**\n`;
    } else if (crisisLevel === 'high') {
      response += `💙 **Crisis Support Near You** 💙\n\n`;
      response += `**24/7 Crisis Help:**\n`;
    } else {
      response += `🤝 **Support Resources Available** 🤝\n\n`;
      response += `**Professional Support:**\n`;
    }

    // Add immediate help resources
    if (resources.immediate && resources.immediate.length > 0) {
      resources.immediate.slice(0, 3).forEach(resource => {
        response += `📞 **${resource.name}**\n`;
        if (resource.type === 'text' && resource.textCode) {
          response += `   Text "${resource.textCode}" to ${resource.phone}\n`;
        } else {
          response += `   Call: ${resource.phone}\n`;
        }
        response += `   ${resource.description}\n`;
        if (resource.availability_note) {
          response += `   ${resource.availability_note}\n`;
        }
        response += `\n`;
      });
    }

    // Add professional resources
    if (resources.professional && resources.professional.length > 0) {
      response += `\n🏥 **Professional Help:**\n`;
      resources.professional.slice(0, 2).forEach(resource => {
        response += `• **${resource.name}**: ${resource.phone}\n`;
        response += `  ${resource.description}\n`;
        if (resource.distance && resource.distance > 0) {
          response += `  Distance: ${resource.distance} miles\n`;
        }
        response += `\n`;
      });
    }

    if (crisisLevel === 'immediate') {
      response += `\n🆘 **If you're in immediate danger, call 911**\n`;
      response += `💙 **Your life has value. Help is available right now.**`;
    }

    return response;
  }
}

// Export singleton instance
export const emergencyResourceFinder = new EmergencyResourceFinder();