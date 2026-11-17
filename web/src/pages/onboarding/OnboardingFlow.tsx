import { useState } from "react";
import { Step1Account, type AccountFormData } from "./Step1Account";
import { Step2Budget, type BudgetSetupData } from "./Step2Budget";
import { Step3TrackGate, type TrackingPreferenceData } from "./Step3TrackGate";
import { Step4TeamGate, type TeamChoiceData } from "./Step4TeamGate";

export interface OnboardingFlowProps {
  initialStep?: 1 | 2 | 3 | 4;
  currentStep?: 1 | 2 | 3 | 4;
  onStepChange?: (step: 1 | 2 | 3 | 4) => void;
  onComplete: (summary: {
    account: AccountFormData;
    budget: BudgetSetupData;
    tracking: TrackingPreferenceData;
    team: TeamChoiceData;
  }) => void;
  onBackToLogin: () => void;
}

export function OnboardingFlow({
  initialStep = 1,
  currentStep: controlledStep,
  onStepChange,
  onComplete,
  onBackToLogin,
}: OnboardingFlowProps) {
  const [internalStep, setInternalStep] = useState<1 | 2 | 3 | 4>(initialStep);
  const currentStep = controlledStep ?? internalStep;

  const goToStep = (step: 1 | 2 | 3 | 4) => {
    setInternalStep(step);
    onStepChange?.(step);
  };

  const [accountData, setAccountData] = useState<AccountFormData>({
    firstName: "Tolu",
    lastName: "Adeniyi",
    age: 24,
    email: "tolu@example.com",
    phone: "08012345678",
    password: "Password123!",
  });

  const [budgetData, setBudgetData] = useState<BudgetSetupData | null>(null);
  const [trackingData, setTrackingData] = useState<TrackingPreferenceData | null>(null);

  const handleStep1Next = (data: AccountFormData) => {
    setAccountData(data);
    goToStep(2);
  };

  const handleStep2Next = (data: BudgetSetupData) => {
    setBudgetData(data);
    goToStep(3);
  };

  const handleStep3Next = (data: TrackingPreferenceData) => {
    setTrackingData(data);
    goToStep(4);
  };

  const handleStep4Complete = (teamData: TeamChoiceData) => {
    if (!budgetData || !trackingData) return;
    onComplete({
      account: accountData,
      budget: budgetData,
      tracking: trackingData,
      team: teamData,
    });
  };

  return (
    <div className="onboarding-flow-container">
      {currentStep === 1 && (
        <Step1Account
          initialData={accountData}
          onNext={handleStep1Next}
          onBackToLogin={onBackToLogin}
        />
      )}

      {currentStep === 2 && (
        <Step2Budget
          initialData={budgetData || undefined}
          onNext={handleStep2Next}
          onBack={() => goToStep(1)}
        />
      )}

      {currentStep === 3 && (
        <Step3TrackGate
          initialTier={trackingData?.tier || "automated"}
          onNext={handleStep3Next}
          onBack={() => goToStep(2)}
        />
      )}

      {currentStep === 4 && (
        <Step4TeamGate
          userState="Lagos"
          userName={`${accountData.firstName} ${accountData.lastName}`}
          onComplete={handleStep4Complete}
          onBack={() => goToStep(3)}
        />
      )}
    </div>
  );
}

