import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { Card, CardBody, CardHeader } from '../common/Card';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../contexts/AuthContext';
import type { OnboardingData } from '../../types';

const MAJORS = [
  'Computer Science',
  'Engineering',
  'Business',
  'Biology',
  'Psychology',
  'English',
  'Mathematics',
  'History',
  'Art',
  'Music',
];

const INTERESTS = [
  'Sports',
  'Music',
  'Art',
  'Gaming',
  'Technology',
  'Reading',
  'Cooking',
  'Travel',
  'Photography',
  'Fitness',
  'Volunteering',
  'Movies',
  'Outdoor Activities',
  'Dancing',
  'Writing',
];

const YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'];

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<OnboardingData>({
    majors: [],
    interests_hobbies: [],
    year: '',
    graduationYear: new Date().getFullYear() + 4,
    privacySettings: {
      profileVisible: true,
      showEmail: false,
      allowMessages: true,
      showGroups: true,
    },
  });

  const toggleMajor = (major: string) => {
    setFormData((prev) => ({
      ...prev,
      majors: prev.majors.includes(major)
        ? prev.majors.filter((m) => m !== major)
        : [...prev.majors, major],
    }));
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests_hobbies: prev.interests_hobbies.includes(interest)
        ? prev.interests_hobbies.filter((i) => i !== interest)
        : [...prev.interests_hobbies, interest],
    }));
  };

  const canProceed = () => {
    if (step === 1) return formData.majors.length > 0;
    if (step === 2) return formData.interests_hobbies.length >= 3;
    if (step === 3) return formData.year && formData.graduationYear;
    return true;
  };

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');

    try {
      await authService.completeOnboarding(formData);
      await refreshUser();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to complete onboarding');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome to DawgPound!
              </h2>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Step {step} of 4
              </p>
            </div>
            <div className="flex space-x-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-2 w-12 rounded-full ${
                    s <= step
                      ? 'bg-blue-600 dark:bg-blue-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardBody>
          {error && (
            <div
              className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg"
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Step 1: Majors */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select Your Major(s)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose at least one major. You can select multiple.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MAJORS.map((major) => (
                  <button
                    key={major}
                    type="button"
                    onClick={() => toggleMajor(major)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      formData.majors.includes(major)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {major}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Interests */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Select Your Interests
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Choose at least 3 interests to help us recommend groups and connect you with others.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${
                      formData.interests_hobbies.includes(interest)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: {formData.interests_hobbies.length}/3 minimum
              </p>
            </div>
          )}

          {/* Step 3: Year & Graduation */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Academic Information
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Tell us about your academic status
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Year of Study
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {YEARS.map((year) => (
                    <button
                      key={year}
                      type="button"
                      onClick={() => setFormData({ ...formData, year })}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        formData.year === year
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      {year}
                    </button>
                  ))}
                </div>
              </div>

              <Input
                id="graduationYear"
                type="number"
                label="Expected Graduation Year"
                value={formData.graduationYear}
                onChange={(e) =>
                  setFormData({ ...formData, graduationYear: parseInt(e.target.value) })
                }
                min={new Date().getFullYear()}
                max={new Date().getFullYear() + 10}
                required
              />
            </div>
          )}

          {/* Step 4: Privacy Settings */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Privacy Settings
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Control who can see your information and interact with you
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'profileVisible' as const,
                    label: 'Make my profile visible to others',
                    description: 'Others can view your profile and see your basic information',
                  },
                  {
                    key: 'showEmail' as const,
                    label: 'Show my email address',
                    description: 'Your email will be visible on your profile',
                  },
                  {
                    key: 'allowMessages' as const,
                    label: 'Allow private messages',
                    description: 'Friends can send you private messages',
                  },
                  {
                    key: 'showGroups' as const,
                    label: 'Show groups I belong to',
                    description: 'Your group memberships will be visible on your profile',
                  },
                ].map((setting) => (
                  <label
                    key={setting.key}
                    className="flex items-start p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <input
                      type="checkbox"
                      checked={formData.privacySettings[setting.key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          privacySettings: {
                            ...formData.privacySettings,
                            [setting.key]: e.target.checked,
                          },
                        })
                      }
                      className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div className="ml-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {setting.label}
                      </span>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {setting.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={step === 1 || isLoading}
            >
              Back
            </Button>
            {step < 4 ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
              >
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isLoading}
              >
                Complete Setup
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
