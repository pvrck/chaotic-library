import ChallengeBoard from '@/components/Dashboard/ChallengeBoard';
import { ExperienceBar } from '@/components/Dashboard/ExperienceBar';

export const DashboardPage = () => {
  return (
    <div className="animate-in fade-in duration-200">
      <div className="w-full max-w-4xl mx-auto space-y-6">
        <ExperienceBar />
        <ChallengeBoard />
      </div>
    </div>
  );
};
