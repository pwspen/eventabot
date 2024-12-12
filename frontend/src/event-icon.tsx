import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Calendar, MapPin } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export interface Event {
  id: string;
  name: string;
  description: string;
  datetime: string;
  eventLink: string;
  distance?: number;
  matchScore?: number;
}

interface EventListProps {
  events: Event[];
} 

export const EventList: React.FC<EventListProps> = ({ events }) => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const toggleExpand = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const formatDateTime = (datetime: string): string => {
    const date = new Date(datetime);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString(undefined, { 
      hour: 'numeric', 
      minute: '2-digit', 
      hourCycle: 'h12' 
    })}`;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 80) return 'bg-emerald-100';
    if (score >= 70) return 'bg-orange-100';
    if (score >= 60) return 'bg-orange-100';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="flex flex-col">
      {events.map((event) => (
        <div
          key={event.id}
          className="border rounded-lg p-4 mb-2 cursor-pointer hover:shadow-lg transition-shadow duration-200 bg-white"
          onClick={() => toggleExpand(event.id)}
        >
          <div className="flex justify-between items-start">
            <div className="flex-grow">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">{event.name}</h2>
                {event.matchScore !== undefined && (
                  <span className={`${getMatchScoreColor(event.matchScore)} text-sm px-3 py-1 rounded-full border border-gray-300 transition-colors duration-200`}>
                    {event.matchScore}% Match
                  </span>
                )}
              </div>
              <div className="mt-2 space-y-1 text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDateTime(event.datetime)}</span>
                </div>
                {event.distance !== undefined && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{(event.distance * 0.621371).toFixed(1)} mi</span>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-4">
              {expandedEventId === event.id ? (
                <ChevronUp className="w-6 h-6 text-gray-400" />
              ) : (
                <ChevronDown className="w-6 h-6 text-gray-400" />
              )}
            </div>
          </div>
          {expandedEventId === event.id && (
            <div className="mt-4 border-t pt-4">
              <div className="text-gray-700 prose prose-sm max-w-none">
                <ReactMarkdown
                  components={{
                    // Customize link behavior to open in new tab and stop event propagation
                    a: ({ node, ...props }) => (
                      <a
                        {...props}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-blue-500 hover:text-blue-600"
                      />
                    ),
                    // Customize other elements as needed
                    strong: ({ node, ...props }) => (
                      <strong {...props} className="font-bold" />
                    ),
                  }}
                >
                  {event.description}
                </ReactMarkdown>
              </div>
              <a
                href={event.eventLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-blue-500 hover:text-blue-600 font-medium"
                onClick={(e) => e.stopPropagation()}
              >
                View Event →
              </a>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventList;