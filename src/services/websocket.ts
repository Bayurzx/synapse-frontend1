/**
 * WebSocket Client Service
 * 
 * Manages WebSocket connections for real-time updates from Synapse backend.
 */

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export type WebSocketEventType =
  | 'COVENANT_UPDATE'
  | 'ALERT_CREATED'
  | 'ALERT_UPDATED'
  | 'RISK_SCORE_UPDATE'
  | 'DOCUMENT_STATUS_CHANGE'
  | 'CONNECTION_ESTABLISHED';

export interface WebSocketEvent {
  type: WebSocketEventType;
  payload: unknown;
  timestamp: string;
}

export interface CovenantUpdatePayload {
  covenant_id: string;
  facility_id: string;
  borrower_id: string;
  current_value: number;
  status: string;
  headroom: number;
}

export interface AlertPayload {
  id: string;
  type: string;
  severity: string;
  title: string;
  message: string;
  borrower_id: string;
  borrower_name: string;
}

export interface RiskScoreUpdatePayload {
  borrower_id: string;
  score: number;
  previous_score: number;
  risk_tier: string;
}

export interface DocumentStatusPayload {
  document_id: string;
  status: string;
  previous_status: string;
}

type EventCallback = (event: WebSocketEvent) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscriptions: Set<string> = new Set();
  private callbacks: Map<string, Set<EventCallback>> = new Map();
  private isConnecting = false;

  /**
   * Connect to the WebSocket server
   */
  connect(endpoint: string = '/ws/synapse'): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearInterval(checkConnection);
            resolve();
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(`${WS_BASE}${endpoint}`);

        this.ws.onopen = () => {
          console.log('[WebSocket] Connected');
          this.isConnecting = false;
          this.reconnectAttempts = 0;

          // Re-subscribe to all topics
          this.subscriptions.forEach((topic) => {
            this.sendSubscription(topic);
          });

          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            console.error('[WebSocket] Failed to parse message:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          this.isConnecting = false;
        };

        this.ws.onclose = (event) => {
          console.log('[WebSocket] Disconnected:', event.code, event.reason);
          this.isConnecting = false;
          this.attemptReconnect();
        };
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
    this.callbacks.clear();
  }

  /**
   * Subscribe to a topic
   */
  subscribe(topic: string, callback: EventCallback): () => void {
    this.subscriptions.add(topic);

    if (!this.callbacks.has(topic)) {
      this.callbacks.set(topic, new Set());
    }
    this.callbacks.get(topic)!.add(callback);

    // Send subscription if connected
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.sendSubscription(topic);
    }

    // Return unsubscribe function
    return () => {
      this.callbacks.get(topic)?.delete(callback);
      if (this.callbacks.get(topic)?.size === 0) {
        this.callbacks.delete(topic);
        this.subscriptions.delete(topic);
        this.sendUnsubscription(topic);
      }
    };
  }

  /**
   * Subscribe to all events of a specific type
   */
  onEvent(eventType: WebSocketEventType, callback: EventCallback): () => void {
    const topic = `event:${eventType}`;
    return this.subscribe(topic, callback);
  }

  private sendSubscription(topic: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', topic }));
    }
  }

  private sendUnsubscription(topic: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'unsubscribe', topic }));
    }
  }

  private handleMessage(event: WebSocketEvent): void {
    // Notify all callbacks for matching topics
    this.callbacks.forEach((callbacks, topic) => {
      // Check if topic matches (supports wildcards)
      if (this.topicMatches(topic, event)) {
        callbacks.forEach((callback) => {
          try {
            callback(event);
          } catch (error) {
            console.error('[WebSocket] Callback error:', error);
          }
        });
      }
    });
  }

  private topicMatches(topic: string, event: WebSocketEvent): boolean {
    // Guard against malformed events
    if (!event || !event.type) {
      console.warn('[WebSocket] Received event without type:', event);
      return false;
    }

    // Event type subscription
    if (topic.startsWith('event:')) {
      return topic === `event:${event.type}`;
    }

    // Wildcard subscriptions
    if (topic.endsWith(':*')) {
      const prefix = topic.slice(0, -2);
      return event.type.toLowerCase().startsWith(prefix.toLowerCase());
    }

    // Exact match
    return topic === event.type;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.connect().catch((error) => {
        console.error('[WebSocket] Reconnection failed:', error);
      });
    }, delay);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Singleton instance
export const wsClient = new WebSocketClient();

export default wsClient;
