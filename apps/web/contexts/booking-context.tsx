'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface BookingPrefill {
  date?: string;
  time?: string;
  staffId?: string;
  serviceId?: string;
  customerId?: string;
  petId?: string;
  mode?: 'APPOINTMENT' | 'GROOMING_QUEUE' | 'CLINIC';
}

export interface CreatedAppointmentEventData {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerLine?: string;
  petId: string;
  petName: string;
  petSpecies: 'DOG' | 'CAT';
  petBreed: string;
  petWeight: number;
  petAllergies?: string;
  petBehavior?: string;
  serviceId: string;
  serviceName: string;
  serviceCategory: 'GROOMING' | 'CLINIC' | 'VACCINE' | 'SPA';
  staffId: string;
  staffName: string;
  startAt: string;
  endAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priceMinor: number;
  notes?: string;
  source: 'LINE' | 'PHONE' | 'WALK_IN' | 'ONLINE_BOOKING';
}

interface BookingContextType {
  isOpen: boolean;
  prefill: BookingPrefill | null;
  openBookingModal: (prefill?: BookingPrefill) => void;
  closeBookingModal: () => void;
  notifyAppointmentCreated: (appointment: CreatedAppointmentEventData) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prefill, setPrefill] = useState<BookingPrefill | null>(null);

  const openBookingModal = useCallback((newPrefill?: BookingPrefill) => {
    setPrefill(newPrefill || null);
    setIsOpen(true);
  }, []);

  const closeBookingModal = useCallback(() => {
    setIsOpen(false);
    setPrefill(null);
  }, []);

  const notifyAppointmentCreated = useCallback((appointment: CreatedAppointmentEventData) => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('petflow:appointment-created', { detail: appointment })
      );
    }
  }, []);

  return (
    <BookingContext.Provider
      value={{
        isOpen,
        prefill,
        openBookingModal,
        closeBookingModal,
        notifyAppointmentCreated,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
