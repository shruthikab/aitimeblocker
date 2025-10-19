// API utilities for backend communication

const API_BASE_URL = 'https://bi6vs9an4k.execute-api.us-east-1.amazonaws.com/dev';

/**
 * Fetch user preferences from backend
 */
export async function fetchPreferences() {
  try {
    const response = await fetch(`${API_BASE_URL}/preferences`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch preferences');
    }
    
    const data = await response.json();
    return data.preferences;
  } catch (error) {
    console.warn('Backend not available, using default preferences:', error.message);
    // Return default preferences when backend is unavailable
    return {
      maxBlock: 120,
      breakMinutes: 15,
      workHoursStart: '09:00',
      workHoursEnd: '17:00',
      maxHoursPerDay: 8,
      preferredDays: [1, 2, 3, 4, 5],
      mode: 'flexi'
    };
  }
}

/**
 * Save user preferences to backend
 */
export async function savePreferences(preferences) {
  try {
    const response = await fetch(`${API_BASE_URL}/preferences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save preferences');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Backend not available, preferences saved locally only:', error.message);
    // Return success even if backend fails (local state will persist)
    return { success: true, preferences, message: 'Saved locally (backend unavailable)' };
  }
}

/**
 * Fetch all events for the current user
 */
export async function fetchEvents() {
  try {
    const response = await fetch(`${API_BASE_URL}/events`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }
    
    const data = await response.json();
    return data.events;
  } catch (error) {
    console.warn('Backend not available, no events loaded:', error.message);
    // Return empty array when backend is unavailable
    return [];
  }
}

/**
 * Fetch all tasks for the current user
 */
export async function fetchTasks() {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }
    
    const data = await response.json();
    return data.tasks;
  } catch (error) {
    console.warn('Backend not available, no tasks loaded:', error.message);
    // Return empty array when backend is unavailable
    return [];
  }
}

/**
 * Import ICS calendar file
 */
export async function importICSFile(icsContent) {
  try {
    const response = await fetch(`${API_BASE_URL}/import/ics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ icsContent }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to import calendar');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('Backend not available for import, events stored locally only:', error.message);
    // Return mock success - events will still be parsed and shown locally
    return {
      message: 'Events imported locally (backend unavailable)',
      count: 0,
      events: []
    };
  }
}

/**
 * Generate task plan
 */
export async function generatePlan(tasks, preferences, existingEvents, startDate, endDate) {
  try {
    const response = await fetch(`${API_BASE_URL}/plan/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tasks,
        preferences,
        existingEvents,
        startDate,
        endDate,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate plan');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating plan:', error);
    // Re-throw for plan generation since this is a critical feature
    // The UI will show a proper error message
    throw new Error('Backend unavailable. Please deploy the backend Lambda function first. See TESTING_GUIDE.md for deployment instructions.');
  }
}

/**
 * Parse tasks from syllabus text using AI (Bedrock)
 */
export async function parseTasks(syllabusText) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ syllabusText }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to parse tasks');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error parsing tasks:', error);
    throw new Error('Failed to parse tasks. Make sure Bedrock is enabled and Lambda has proper IAM permissions.');
  }
}

