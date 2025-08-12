'use client'
import { Button } from '@/components/ui/Button';

interface FormNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSubmitting: boolean;
  tabs: { id: string; label: string }[];
}

const FormNavigation = ({
  activeTab,
  setActiveTab,
  isSubmitting,
  tabs
}: FormNavigationProps) => {
  const currentIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <div className="flex justify-between mt-8">
      <Button
        type="button"
        variant="outline"
        onClick={() => setActiveTab(tabs[currentIndex - 1]?.id)}
        disabled={currentIndex <= 0}
      >
        Previous
      </Button>

      <div>
        {currentIndex < tabs.length - 1 ? (
          <Button
            type="button"
            onClick={() => setActiveTab(tabs[currentIndex + 1]?.id)}
          >
            Next
          </Button>
        ) : (
          <Button 
            type="submit" 
            loading={isSubmitting}
          >
            Create Campaign
          </Button>
        )}
      </div>
    </div>
  );
};

export default FormNavigation;  // Default export