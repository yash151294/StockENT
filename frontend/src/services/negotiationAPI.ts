import api from './api';
import { 
  Negotiation, 
  CreateNegotiationData, 
  CounterOfferData 
} from '../types';

export const negotiationAPI = {
  /**
   * Get user's negotiations
   */
  getNegotiations: (role?: 'buyer' | 'seller'): Promise<Negotiation[]> =>
    api.get<Negotiation[]>('/negotiations', {
      params: role ? { role } : undefined
    }).then((response: any) => response.data),

  /**
   * Get single negotiation
   */
  getNegotiation: (id: string): Promise<Negotiation> =>
    api.get<Negotiation>(`/negotiations/${id}`).then((response: any) => response.data),

  /**
   * Create negotiation (buyer)
   */
  createNegotiation: (data: CreateNegotiationData): Promise<Negotiation> =>
    api.post<Negotiation>('/negotiations', data).then((response: any) => response.data),

  /**
   * Send counter-offer (seller)
   */
  sendCounterOffer: (id: string, data: CounterOfferData): Promise<Negotiation> =>
    api.post<Negotiation>(`/negotiations/${id}/counter-offer`, data).then((response: any) => response.data),

  /**
   * Accept counter-offer (buyer)
   */
  acceptCounterOffer: (id: string): Promise<{ 
    negotiation: Negotiation; 
    cartItem: any 
  }> =>
    api.post<{ negotiation: Negotiation; cartItem: any }>(`/negotiations/${id}/accept`).then((response: any) => response.data),

  /**
   * Decline counter-offer (buyer)
   */
  declineCounterOffer: (id: string): Promise<Negotiation> =>
    api.post<Negotiation>(`/negotiations/${id}/decline`).then((response: any) => response.data),

  /**
   * Cancel negotiation
   */
  cancelNegotiation: (id: string): Promise<Negotiation> =>
    api.delete<Negotiation>(`/negotiations/${id}`).then((response: any) => response.data),
};
