// Types and interfaces
export interface Coordinates {
    latitude: number;
    longitude: number;
  }
  
  export interface MeetupEvent {
    name: string;
    description: string;
    datetime: Date;
    maxTickets?: number;
    eventType: string;
    rsvpCount: number;
    eventLink: string;
    location?: Coordinates;
    distance?: number;
    matchScore?: number;
  }
  
  interface GraphQLResponse {
    data: {
      result: {
        edges: Array<{
          node: {
            title: string;
            description: string;
            dateTime: string;
            maxTickets: number | null;
            eventType: string;
            rsvps: {
              totalCount: number;
            };
            eventUrl: string;
            venue: {
              lat: number;
              lon: number;
            } | null;
          };
        }>;
      };
    };
  }
  
  interface OpenRouterResponse {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  }
  
  // Configuration
  export interface MeetupClientConfig {
    openRouterApiKey: string;
    model?: string;
  }
  
  // Main client class
  export class MeetupClient {
    private readonly apiKey: string;
    private readonly model: string;
    private readonly baseUrl = "https://www.meetup.com/gql2";
    private readonly openRouterUrl = "https://openrouter.ai/api/v1/chat/completions";
  
    constructor(config: MeetupClientConfig) {
      this.apiKey = config.openRouterApiKey;
      this.model = config.model || "meta-llama/llama-3.1-70b-instruct:free";
    }
  
    private calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
      const R = 6371; // Earth's radius in kilometers
      const { latitude: lat1, longitude: lon1 } = coord1;
      const { latitude: lat2, longitude: lon2 } = coord2;
  
      const [rlat1, rlon1, rlat2, rlon2] = [lat1, lon1, lat2, lon2].map((x) => (x * Math.PI) / 180);
  
      const dlat = rlat2 - rlat1;
      const dlon = rlon2 - rlon1;
  
      const a =
        Math.sin(dlat / 2) ** 2 +
        Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(dlon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
      return R * c;
    }
  
    private async openRouterRequest(prompt: string): Promise<string> {
      const response = await fetch(this.openRouterUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
        }),
      });
  
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }
  
      const data = (await response.json()) as OpenRouterResponse;
      return data.choices[0].message.content;
    }
  
    private async generateMatchRating(
      event: MeetupEvent,
      interests: string
    ): Promise<number> {
      const prompt = `
        User interests: '${interests}'
  
        The above is input from a user specifying what type of event they would like to attend. The below is an event. Succinctly, reason about how good of a match there is between the interests and the event. Based on the user's interests, extrapolate what else they might be interested in - don't just throw things out that don't exactly match the interests. Finally, give a match rating as an integer 0-100 enclosed in curly brackets like so: {74}. Don't be afraid to give 0's or 100's for complete mismatches or perfect matches.
        
        Event name: ${event.name}
        Event description: ${event.description}
        Event date: ${event.datetime}
        Event distance from user: ${event.distance}
      `;
  
      const response = await this.openRouterRequest(prompt);
      try {
        const match = response.split("{").pop()?.split("}")[0];
        return match ? parseInt(match, 10) : 0;
      } catch (error) {
        console.error("Failed to parse match rating:", error);
        return 0;
      }
    }
  
    public async findNearbyEvents(params: {
      location: Coordinates;
      numEvents?: number;
      interests?: string;
    }): Promise<MeetupEvent[]> {
      const { location, numEvents = 10, interests } = params;
  
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operationName: "recommendedEventsWithSeries",
          variables: {
            first: numEvents,
            lat: location.latitude,
            lon: location.longitude,
            startDateRange: new Date().toISOString(),
            eventType: "PHYSICAL",
            sortField: "DATETIME",
            doConsolidateEvents: true,
          },
          extensions: {
            persistedQuery: {
              version: 1,
              sha256Hash: "d3b3542df9c417007a7e6083b931d2ed67073f4d74891c3f14da403164e56469",
            },
          },
        }),
      });
  
      if (!response.ok) {
        throw new Error(`Meetup API error: ${response.statusText}`);
      }
  
      const data = (await response.json()) as GraphQLResponse;
      
      let events: MeetupEvent[] = data.data.result.edges.map((edge) => {
        const node = edge.node;
        const venue = node.venue;
  
        const event: MeetupEvent = {
          name: node.title,
          description: node.description,
          datetime: new Date(node.dateTime),
          maxTickets: node.maxTickets || undefined,
          eventType: node.eventType,
          rsvpCount: node.rsvps.totalCount,
          eventLink: node.eventUrl,
        };
  
        if (venue) {
          event.location = {
            latitude: venue.lat,
            longitude: venue.lon,
          };
          event.distance = this.calculateDistance(location, event.location);
        }
  
        return event;
      });
  
      // If interests are provided, generate match scores
      if (interests) {
        events = await Promise.all(
          events.map(async (event) => ({
            ...event,
            matchScore: await this.generateMatchRating(event, interests),
          }))
        );
        
        // Sort by match score
        events.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      }
  
      return events;
    }
  }