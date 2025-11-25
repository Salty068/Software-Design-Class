
export interface HomeStats {
  volunteerCount: number;
  upcomingEvents: number;
  totalHours: number;
  completedToday: number;
}

export interface FeaturedEvent {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  urgency: string;
  requiredSkills: string[];
  signedUpCount: number;
  createdAt: string;
}

export interface HomeApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const API_BASE = '/api/home';

export async function getHomeStats(): Promise<HomeApiResponse<HomeStats>> {
  try {
    const response = await fetch(`${API_BASE}/stats`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching home stats:', error);
    return {
      success: false,
      message: 'Failed to fetch statistics'
    };
  }
}

export async function getFeaturedEvents(): Promise<HomeApiResponse<FeaturedEvent[]>> {
  try {
    const response = await fetch(`${API_BASE}/featured-events`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching featured events:', error);
    return {
      success: false,
      message: 'Failed to fetch featured events'
    };
  }
}