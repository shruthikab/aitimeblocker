"use client";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import TuneStep from "../../components/TuneStep";
import { fetchEvents, fetchPreferences } from "../../lib/api";

// Dynamically import PlanStepWithDnd to avoid SSR issues with react-big-calendar
const PlanStepWithDnd = dynamic(
  () => import("../../components/PlanStepWithDnd"),
  { 
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading calendar...</p>
        </div>
      </div>
    )
  }
);

export default function PlanPage() {
  const [currentStep, setCurrentStep] = useState(1); // 1: Tune, 2: Plan
  const [preferences, setPreferences] = useState(null);
  const [existingEvents, setExistingEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load events and preferences from backend on mount
  useEffect(() => {
    loadBackendData();
  }, []);

  const loadBackendData = async () => {
    try {
      setIsLoading(true);
      const [events, prefs] = await Promise.all([
        fetchEvents(),
        fetchPreferences()
      ]);
      
      if (events && events.length > 0) {
        const formattedEvents = events.map(event => ({
          id: event.uid || event.id,
          title: event.title || event.summary,
          start: event.start,
          end: event.end,
        }));
        setExistingEvents(formattedEvents);
      }
      
      if (prefs) {
        setPreferences(prefs);
      }
    } catch (error) {
      console.error('Error loading backend data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingsSave = (settings) => {
    setPreferences(settings);
    console.log("Preferences saved:", settings);
  };

  const handleNextStep = () => {
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            AI Time Blocker
          </h1>
          <p className="text-lg text-gray-600">
            Smart scheduling with burnout prevention
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 ${
                currentStep === 1 ? "text-blue-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                1
              </div>
              <span className="font-semibold">Tune Preferences</span>
            </div>
            <div className="w-12 h-1 bg-gray-300"></div>
            <div
              className={`flex items-center gap-2 ${
                currentStep === 2 ? "text-purple-600" : "text-gray-400"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  currentStep === 2
                    ? "bg-purple-600 text-white"
                    : "bg-gray-300 text-gray-600"
                }`}
              >
                2
              </div>
              <span className="font-semibold">Generate Plan</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex justify-center">
          {currentStep === 1 && (
            <div className="w-full flex flex-col items-center gap-4">
              <TuneStep onSettingsChange={handleSettingsSave} />
              <button
                onClick={handleNextStep}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Next: Generate Plan →
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="w-full">
              <button
                onClick={handlePrevStep}
                className="mb-4 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back to Preferences
              </button>
              <PlanStepWithDnd
                preferences={preferences}
                existingEvents={existingEvents}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

