import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { EventList, Event } from './event-icon';
import { MapPin } from "lucide-react";

interface LocationButtonProps {
    onLocation?: (coords: GeolocationCoordinates) => void;
}

export function LocationButton({ onLocation }: LocationButtonProps): JSX.Element {
  const handleClick = async (e: React.MouseEvent): Promise<void> => {
    e.preventDefault(); // Prevent form submission
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        if (onLocation) {
          onLocation(position.coords);
        }
      } catch (error) {
        console.error('Error getting location:', error);
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      type="button" // Explicitly set type to prevent form submission
      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200 shadow-sm"
    >
      <MapPin className="w-4 h-4" />
      Use device location
    </button>
  );
}

export default function EventFinder() {
  const [zipCode, setZipCode] = useState('');
  const [interests, setInterests] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSources, setSelectedSources] = useState({
    eventbrite: true,
    meetup: true,
    facebook: false,
    ticketmaster: true,
    stubhub: false,
    local: true
  });

  const eventSources = [
    { id: 'eventbrite', label: 'Eventbrite' },
    { id: 'meetup', label: 'Meetup' },
    { id: 'facebook', label: 'Facebook Events' },
    { id: 'ticketmaster', label: 'Ticketmaster' },
    { id: 'stubhub', label: 'StubHub' },
  ];

  const handleLocationReceived = (coords: GeolocationCoordinates) => {
    console.log(coords);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    setEvents([]);
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://eventabot.onrender.com/api/recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude: 33.75,
          longitude: -84.39,
          interests: interests || '',
          num_events: 10,
          verbose: false,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch events');
      }

      const data = await response.json();
      setEvents(data.events);
      console.log("Events: ", data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-gray-200 flex flex-row justify-center">
      <div className="p-6 flex flex-col w-screen items-center">
        <div className="flex flex-col min-w-4xl w-[450px] mb-3">
            <h1 className="text-3xl font-bold mb-6">Eventabot</h1>
            <form onSubmit={handleSubmit} className="mb-8 space-y-4">
              <div className="flex items-center gap-4">
                <LocationButton onLocation={handleLocationReceived} />
                <span className="text-gray-600">or</span>
                <div className="flex-1 max-w-[200px]">
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="w-[70%] p-2 border rounded"
                    placeholder="Enter ZIP code"
                  />
                </div>
              </div>

              <div>
                <label className="block text-md font-bold mb-1">Interests</label>
                <textarea
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="What kind of events do you want to attend?"
                />
              </div>

              <div>
                <label className="block text-md font-bold mb-2">Event Sources</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {eventSources.map(source => (
                    <div key={source.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={source.id}
                        checked={selectedSources[source.id as keyof typeof selectedSources]}
                        onChange={(e) => setSelectedSources(prev => ({
                          ...prev,
                          [source.id]: e.target.checked
                        }))}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={source.id} className="text-sm text-gray-700">
                        {source.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  Find Events
                </button>
                {loading && <span className="text-gray-600">Can take up to 20s</span>}
              </div>
            </form>

            <div className="flex items-center gap-4">
              <form 
                method="POST" 
                action="https://docs.google.com/forms/d/e/1FAIpQLSc9cfe7Gk4beFpJNZDaII1S6GR1CcludQeerkoYhExFHiUflg/formResponse"
                className="flex-1 flex items-center gap-2"
              >
                <div className="flex flex-col">
                  <input
                    type="email"
                    name="entry.1819398088"
                    placeholder="Enter your email"
                    required
                    className="w-[300px] flex-1 p-2 border rounded mb-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled
                    className="bg-gray-400 text-white px-4 py-2 mb-2 rounded cursor-not-allowed flex-shrink-0"
                  >
                    Email me events weekly
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm font-medium transition-colors duration-200"
                  >
                    Notify me when weekly emails are available
                  </button>
                </div>
              </form>
            </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="w-[50%]">
          {events.length > 0 ? (
            <EventList events={events}/>
          ) : (
            <EventList events={[]}/>
          )}
        </div>
      </div>
    </div>
  );
}