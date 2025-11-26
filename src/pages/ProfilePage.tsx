import { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getProfile, createProfile, updateProfile } from "../services/profile.api";
import type { ProfileData } from "../services/profile.api";
import { useToast } from "../components/ToastProvider";
import { useAuth } from "../contexts/AuthContext";

// Custom CSS for DatePicker to match theme
const datePickerStyles = `
  .react-datepicker {
    border: 2px solid #fed7aa !important;
    border-radius: 0.5rem !important;
    background: linear-gradient(to bottom right, #ffffff, #fff7ed) !important;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05) !important;
  }
  
  .react-datepicker__header {
    background: linear-gradient(to right, #f97316, #ea580c) !important;
    border-bottom: 1px solid #fed7aa !important;
    border-radius: 0.5rem 0.5rem 0 0 !important;
  }
  
  .react-datepicker__current-month,
  .react-datepicker__day-name {
    color: white !important;
    font-weight: 600 !important;
  }
  
  .react-datepicker__day {
    color: #1f2937 !important;
    border-radius: 0.375rem !important;
    margin: 0.125rem !important;
  }
  
  .react-datepicker__day:hover {
    background-color: #fed7aa !important;
    color: #ea580c !important;
  }
  
  .react-datepicker__day--selected {
    background-color: #f97316 !important;
    color: white !important;
    font-weight: 600 !important;
  }
  
  .react-datepicker__day--highlighted {
    background-color: #fbbf24 !important;
    color: #92400e !important;
    font-weight: 600 !important;
    border: 2px solid #f59e0b !important;
  }
  
  .react-datepicker__day--highlighted:hover {
    background-color: #f59e0b !important;
    color: white !important;
  }
  
  .react-datepicker__navigation {
    border: none !important;
  }
  
  .react-datepicker__navigation--previous {
    border-right-color: white !important;
  }
  
  .react-datepicker__navigation--next {
    border-left-color: white !important;
  }
  
  .react-datepicker__month-dropdown,
  .react-datepicker__year-dropdown {
    background-color: white !important;
    border: 2px solid #fed7aa !important;
    border-radius: 0.375rem !important;
  }
  
  .react-datepicker__month-dropdown-container--scroll,
  .react-datepicker__year-dropdown-container--scroll {
    max-height: 200px !important;
  }
  
  .react-datepicker__month-option:hover,
  .react-datepicker__year-option:hover {
    background-color: #fed7aa !important;
    color: #ea580c !important;
  }
  
  .react-datepicker__month-option--selected,
  .react-datepicker__year-option--selected {
    background-color: #f97316 !important;
    color: white !important;
  }
`;

export default function ProfilePage() {
  const { user } = useAuth();
  const toast = useToast();
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Profile</h2>
          <p className="text-gray-600">Please wait while we load your information...</p>
        </div>
      </div>
    );
  }

  const userId = user.id;
  
  const [activeTab, setActiveTab] = useState<'edit' | 'summary'>('edit');
  const [name, setName] = useState('');
  const [address1, setAddress1] = useState('');
  const [address2, setAddress2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [preference, setPreference] = useState('');
  const [availability, setAvailability] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);

 
  const availableSkills = [
    'Event Planning',
    'Fundraising',
    'Marketing & Social Media',
    'Graphic Design',
    'Photography',
    'Videography',
    'Writing & Content Creation',
    'Public Speaking',
    'Teaching & Tutoring',
    'Mentoring',
    'Administrative Support',
    'Data Entry',
    'Customer Service',
    'Community Outreach',
    'Food Service',
    'Cooking',
    'Childcare',
    'Elder Care',
    'Pet Care',
    'Construction & Repair',
    'Gardening & Landscaping',
    'Environmental Conservation',
    'Medical & Healthcare',
    'First Aid & CPR',
    'Translation & Interpretation',
    'IT & Tech Support',
    'Web Development',
    'Legal Assistance',
    'Accounting & Finance',
    'Sports & Fitness Coaching',
  ];

  const toggleSkill = (skill: string) => {
    setSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

 
  useEffect(() => {
    if (userId) {
      loadProfileData();
    }
  }, [userId]);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      const response = await getProfile(userId);
      
      if (response.success && response.data) {
        // Profile exists, populate the form with existing data
        console.log('Profile loaded successfully:', response.data);
        setName(response.data.fullName);
        setAddress1(response.data.location.address1);
        setAddress2(response.data.location.address2 || '');
        setCity(response.data.location.city);
        setState(response.data.location.state);
        setZip(response.data.location.zipCode);
        setSkills(response.data.skills || []);
        setPreference(response.data.preferences || '');
        
        // Handle availability - check if it's an array or object and validate dates
        if (Array.isArray(response.data.availability)) {
          const validDates = response.data.availability
            .map((day: string) => new Date(day))
            .filter((date: Date) => !isNaN(date.getTime())); // Filter out invalid dates
          setAvailability(validDates);
        } else {
          setAvailability([]);
        }
        
        // Check if this is a new user (profile exists but is empty/incomplete)
        const isEmpty = !response.data.location.address1 || 
                       !response.data.location.city || 
                       !response.data.location.state || 
                       !response.data.location.zipCode ||
                       !response.data.skills ||
                       response.data.skills.length === 0;
        
        setIsNewUser(isEmpty);
        setProfileExists(true);
        setProfileLoaded(true);
        console.log('Profile exists set to:', true, 'IsNewUser:', isEmpty);
      } else {
        // Profile doesn't exist yet
        console.log('Profile not found, response:', response);
        setProfileExists(false);
        setIsNewUser(false);
        setProfileLoaded(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setProfileLoaded(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure profile data is loaded before submitting
    if (!profileLoaded) {
      toast.error('Profile is still loading. Please wait a moment.');
      return;
    }
    
    if (!name.trim()) {
      toast.error('Please enter your name.');
      return;
    }
    
    if (!address1.trim()) {
      toast.error('Please enter your address.');
      return;
    }
    
    if (!city.trim()) {
      toast.error('Please enter your city.');
      return;
    }
    
    if (!state) {
      toast.error('Please select your state.');
      return;
    }
    
    if (!zip.trim()) {
      toast.error('Please enter your zip code.');
      return;
    }
    
    if (zip.length < 5 || zip.length > 9) {
      toast.error('Zip code must be between 5 and 9 characters.');
      return;
    }

    if (skills.length === 0) {
      toast.error('Please select at least one skill.');
      return;
    }

    if (availability.length === 0) {
      toast.error('Please select at least one availability date.');
      return;
    }

    
    const profileData: ProfileData = {
      fullName: name,
      location: {
        address1: address1,
        address2: address2 || undefined,
        city: city,
        state: state,
        zipCode: zip
      },
      skills: skills,
      preferences: preference || undefined,
      availability: availability.map(date => date.toLocaleDateString('en-US', { weekday: 'long' }))
    };

    setIsLoading(true);
    try {
      let response;
      
      console.log('Submitting profile, profileExists:', profileExists, 'userId:', userId);
      if (profileExists) {
        console.log('Using UPDATE profile');
        response = await updateProfile(userId, profileData);
      } else {
        console.log('Using CREATE profile');
        response = await createProfile(userId, profileData);
      }

      if (response.success) {
        if (isNewUser) {
          toast.success('🎉 Welcome! Your profile has been completed. You can now start browsing volunteer opportunities!');
          setIsNewUser(false);
        } else {
          toast.success('Profile updated successfully!');
        }
        setProfileExists(true);
        setActiveTab('summary'); 
      } else {
        const errorMessage = response.errors?.join(', ') || response.message || 'Failed to save profile';
        toast.error(`Error saving profile: ${errorMessage}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('An unexpected error occurred while saving the profile.');
    } finally {
      setIsLoading(false);
    }
  };

return (
  <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#f5efe6' }}>
    <style dangerouslySetInnerHTML={{ __html: datePickerStyles }} />
    
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      
      <div className="absolute top-20 left-10 w-32 h-32 bg-orange-200 rounded-full opacity-20 animate-pulse"></div>
      <div className="absolute top-40 right-16 w-24 h-24 bg-orange-300 rounded-full opacity-15 animate-bounce" style={{ animationDuration: '3s' }}></div>
      <div className="absolute bottom-32 left-20 w-40 h-40 bg-orange-100 rounded-full opacity-25"></div>
      <div className="absolute bottom-20 right-32 w-28 h-28 bg-orange-200 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      
      <div className="absolute top-32 right-8 w-16 h-16 bg-gradient-to-br from-orange-300 to-orange-400 opacity-20 transform rotate-45"></div>
      <div className="absolute bottom-48 left-8 w-20 h-20 bg-gradient-to-tr from-orange-200 to-orange-300 opacity-15 transform rotate-12"></div>
      
      
      <div className="absolute inset-0 opacity-5">
        <div className="grid grid-cols-12 gap-8 h-full">
          {[...Array(60)].map((_, i) => (
            <div key={i} className="bg-orange-400 rounded-full w-2 h-2 opacity-30"></div>
          ))}
        </div>
      </div>
    </div>

    
    <div className="relative z-10 py-8 px-4"> 
      <div className="max-w-4xl mx-auto">
        
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-orange-100">
          <div className="relative">
            
            <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-300 rounded-full opacity-15 transform -translate-x-12 translate-y-12"></div>
            </div>
            
            
            <div className="relative z-10 py-8 px-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-800 mb-2">My Profile</h1>
                  <p className="text-gray-600">Manage your volunteer information and preferences</p>
                </div>
              </div>
            </div>
          </div>

        {/* Welcome Message for New Users */}
        {isNewUser && !isLoading && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 mx-4 my-4 rounded-xl shadow-lg border border-orange-400">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2">🎉 Welcome to Our Volunteer Community!</h2>
                <p className="text-orange-100 text-sm leading-relaxed">
                  Complete your profile below to start receiving personalized volunteer opportunities. 
                  Add your skills, location, and availability to get matched with the perfect opportunities in your area.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="relative flex bg-gradient-to-r from-orange-50 to-orange-100 px-2 pt-2" style={{ backgroundColor: '#f5efe6' }}>
          <button
            onClick={() => setActiveTab('edit')}
            className={`relative flex-1 py-4 px-6 mx-1 text-center font-semibold rounded-t-xl transition-all duration-300 transform ${
              activeTab === 'edit'
                ? 'text-orange-700 bg-white shadow-lg scale-105 border-t-4 border-orange-500 z-10'
                : 'text-gray-600 bg-orange-100 hover:bg-orange-200 hover:text-orange-700 hover:scale-102 shadow-sm'
            }`}
          >
            <span className="flex items-center justify-center gap-3">
              <div className={`p-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'edit' ? 'bg-orange-100' : 'bg-white/50'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <span className="text-lg">Edit Profile</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`relative flex-1 py-4 px-6 mx-1 text-center font-semibold rounded-t-xl transition-all duration-300 transform ${
              activeTab === 'summary'
                ? 'text-orange-700 bg-white shadow-lg scale-105 border-t-4 border-orange-500 z-10'
                : 'text-gray-600 bg-orange-100 hover:bg-orange-200 hover:text-orange-700 hover:scale-102 shadow-sm'
            }`}
          >
            <span className="flex items-center justify-center gap-3">
              <div className={`p-1.5 rounded-full transition-all duration-300 ${
                activeTab === 'summary' ? 'bg-orange-100' : 'bg-white/50'
              }`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-lg">View Summary</span>
            </span>
          </button>
        </div>

        
        <div className="bg-white shadow-inner rounded-b-xl border-t-0 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-orange-50 to-transparent opacity-40 rounded-full transform translate-x-32 -translate-y-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-orange-50 to-transparent opacity-40 rounded-full transform -translate-x-24 translate-y-24"></div>
          </div>

          <div className="relative z-10 p-8">
            {activeTab === 'edit' ? (
              /* Edit Profile Form */
              <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name*
            </label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              placeholder="Full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address 1*
            </label>
            <input 
              type="text" 
              value={address1} 
              onChange={(e) => setAddress1(e.target.value)} 
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address 2
            </label>
            <input 
              type="text" 
              value={address2} 
              onChange={(e) => setAddress2(e.target.value)} 
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              placeholder="(optional)"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City*
              </label>
              <input 
                type="text" 
                value={city} 
                onChange={(e) => setCity(e.target.value)} 
                maxLength={100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                placeholder="City"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State*
              </label>
              <select 
                value={state} 
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
              >
                <option value="">Select State</option>
                <option value="AL">Alabama</option>
                <option value="AK">Alaska</option>
                <option value="AZ">Arizona</option>
                <option value="AR">Arkansas</option>
                <option value="CA">California</option>
                <option value="CO">Colorado</option>
                <option value="CT">Connecticut</option>
                <option value="DE">Delaware</option>
                <option value="FL">Florida</option>
                <option value="GA">Georgia</option>
                <option value="HI">Hawaii</option>
                <option value="ID">Idaho</option>
                <option value="IL">Illinois</option>
                <option value="IN">Indiana</option>
                <option value="IA">Iowa</option>
                <option value="KS">Kansas</option>
                <option value="KY">Kentucky</option>
                <option value="LA">Louisiana</option>
                <option value="ME">Maine</option>
                <option value="MD">Maryland</option>
                <option value="MA">Massachusetts</option>
                <option value="MI">Michigan</option>
                <option value="MN">Minnesota</option>
                <option value="MS">Mississippi</option>
                <option value="MO">Missouri</option>
                <option value="MT">Montana</option>
                <option value="NE">Nebraska</option>
                <option value="NV">Nevada</option>
                <option value="NH">New Hampshire</option>
                <option value="NJ">New Jersey</option>
                <option value="NM">New Mexico</option>
                <option value="NY">New York</option>
                <option value="NC">North Carolina</option>
                <option value="ND">North Dakota</option>
                <option value="OH">Ohio</option>
                <option value="OK">Oklahoma</option>
                <option value="OR">Oregon</option>
                <option value="PA">Pennsylvania</option>
                <option value="RI">Rhode Island</option>
                <option value="SC">South Carolina</option>
                <option value="SD">South Dakota</option>
                <option value="TN">Tennessee</option>
                <option value="TX">Texas</option>
                <option value="UT">Utah</option>
                <option value="VT">Vermont</option>
                <option value="VA">Virginia</option>
                <option value="WA">Washington</option>
                <option value="WV">West Virginia</option>
                <option value="WI">Wisconsin</option>
                <option value="WY">Wyoming</option>
                <option value="DC">District of Columbia</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Zip Code*
              </label>
              <input 
                type="text" 
                value={zip} 
                onChange={(e) => setZip(e.target.value)} 
                maxLength={9} 
                minLength={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white"
                placeholder="12345"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Skills* <span className="text-gray-500 font-normal">({skills.length} selected)</span>
            </label>
            
            
            {skills.length > 0 && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="ml-1 hover:text-blue-900 focus:outline-none"
                        aria-label={`Remove ${skill}`}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Checkbox grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto p-4 border border-gray-300 rounded-lg bg-gray-50">
              {availableSkills.map((skill) => (
                <label
                  key={skill}
                  className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all duration-150 ${
                    skills.includes(skill)
                      ? 'bg-blue-100 border-2 border-blue-500'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={skills.includes(skill)}
                    onChange={() => toggleSkill(skill)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className={`text-sm ${skills.includes(skill) ? 'font-medium text-blue-900' : 'text-gray-700'}`}>
                    {skill}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preference
            </label>
            <textarea 
              value={preference} 
              onChange={(e) => setPreference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none text-black bg-white"
              placeholder="Any preferences"
            />
          </div>

          <div className="bg-gradient-to-br from-white to-orange-50 p-4 rounded-lg border border-orange-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability*
            </label>
            <p className="text-xs text-gray-600 mb-3">Click on dates to select/deselect your availability. Selected dates will be highlighted in yellow.</p>
            <div className="bg-white rounded-lg border border-orange-200 p-3">
              <DatePicker
                selected={availability.length > 0 && !isNaN(availability[0].getTime()) ? availability[0] : null}
                onChange={(date: Date | null) => {
                  if (date) {
                    const dateExists = availability.some(d => d.getTime() === date.getTime());
                    if (dateExists) {
                      // Remove date if it already exists
                      setAvailability(availability.filter(d => d.getTime() !== date.getTime()));
                    } else {
                      // Add date if it doesn't exist
                      setAvailability([...availability, date]);
                    }
                  }
                }}
                highlightDates={availability}
                placeholderText="Click to select available dates"
                className="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                inline={false}
                shouldCloseOnSelect={false}
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                minDate={new Date()}
              />
            </div>
            <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
              <p className="text-sm font-medium text-orange-800 mb-1">Selected Dates:</p>
              <div className="text-sm text-orange-700">
                {availability.length === 0 ? (
                  <span className="italic">No dates selected</span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availability.map((date, index) => (
                      <span key={index} className="bg-orange-200 text-orange-800 px-2 py-1 rounded-md text-xs font-medium">
                        {date.toLocaleDateString()}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200 font-medium text-lg disabled:bg-orange-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : (profileExists ? 'Update Profile' : 'Save Profile')}
          </button>
        </form>
          ) : (
            /* Profile Summary */
            <div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Name</span>
                  <p className="mt-1 text-lg text-gray-900">{name || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">State</span>
                  <p className="mt-1 text-lg text-gray-900">{state || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">City</span>
                  <p className="mt-1 text-lg text-gray-900">{city || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Zip Code</span>
                  <p className="mt-1 text-lg text-gray-900">{zip || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Address</span>
                  <p className="mt-1 text-lg text-gray-900">{[address1, address2].filter(Boolean).join(', ') || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Skills</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {skills.length > 0 ? (
                      skills.map((skill, index) => (
                        <span key={index} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-900">Not provided</p>
                    )}
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Preferences</span>
                  <p className="mt-1 text-lg text-gray-900">{preference || 'Not provided'}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">Availability</span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {availability.length > 0 ? (
                      availability.map((date, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      ))
                    ) : (
                      <p className="text-gray-900">Not provided</p>
                    )}
                  </div>
                </div>
              </div>
              
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setActiveTab('edit')}
                  className="w-full bg-orange-600 text-white py-3 px-4 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition duration-200 font-medium text-lg"
                >
                  Edit Profile
                </button>
              </div>
            </div>
          )}
          </div>
        </div>
        </div>
      </div>
    </div>
  </div>
);
}
