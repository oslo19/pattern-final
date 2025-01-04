import { useEffect, useState, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useProgress } from '../contexts/ProgressContext';

// Lazy load the chart component
const DoughnutChart = lazy(() => import('./DoughnutChart'));

interface PatternStat {
  attempted: number;
  correct: number;
}

interface UserProgress {
  totalScore: number;
  gamesPlayed: number;
  correctAnswers: number;
  averageAttempts: number;
  patternStats: Record<string, PatternStat>;
}

const getSuccessRate = (correct: number, attempted: number): string => {
  if (attempted === 0) return '0.0';
  return ((correct / attempted) * 100).toFixed(1);
};

export function Profile() {
  const { user } = useAuth();
  const { refreshTrigger } = useProgress();
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [chartError, setChartError] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      if (user) {
        try {
          console.log('Fetching user data for:', user.uid);
          const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${user.uid}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          console.log('Received user data:', data);
          
          // Ensure patternStats exists with default values
          const defaultStats = {
            numeric: { attempted: 0, correct: 0 },
            symbolic: { attempted: 0, correct: 0 },
            shape: { attempted: 0, correct: 0 },
            logical: { attempted: 0, correct: 0 }
          };
          
          const progress = {
            ...data.progress,
            patternStats: {
              ...defaultStats,
              ...(data.progress?.patternStats || {})
            }
          };
          
          console.log('Processed progress data:', progress);
          setUserProgress(progress);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setChartError(true);
        }
      }
    }

    fetchUserData();
  }, [user, refreshTrigger]);

  const patternData = {
    labels: ['Numeric', 'Symbolic', 'Shape', 'Logical'].map(type => 
      `${type} (${getSuccessRate(
        userProgress?.patternStats[type.toLowerCase()]?.correct || 0,
        userProgress?.patternStats[type.toLowerCase()]?.attempted || 0
      )}%)`
    ),
    datasets: [{
      label: 'Success Rate by Pattern Type',
      data: ['numeric', 'symbolic', 'shape', 'logical'].map(type => {
        const stats = userProgress?.patternStats[type];
        if (!stats || stats.attempted === 0) return 0;
        return (stats.correct / stats.attempted) * 100;
      }),
      backgroundColor: [
        'rgba(52, 211, 153, 0.8)',  // emerald
        'rgba(59, 130, 246, 0.8)',  // blue
        'rgba(251, 146, 60, 0.8)',  // orange
        'rgba(167, 139, 250, 0.8)'  // purple
      ]
    }]
  };

  const chartOptions = {
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            return `Success Rate: ${context.parsed.toFixed(1)}%`;
          }
        }
      }
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Profile</h2>
      <div className="space-y-4">
        {/* User Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Email:</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Display Name:</span>
            <span>{user?.displayName || user?.email?.split('@')[0]}</span>
          </div>
        </div>

        {/* Pattern Performance Chart */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Pattern Performance</h3>
          <div className="h-64">
            <Suspense fallback={<div className="h-full flex items-center justify-center">Loading chart...</div>}>
              {!chartError && userProgress ? (
                <DoughnutChart 
                  data={patternData} 
                  options={chartOptions}
                  onError={() => setChartError(true)}
                />
              ) : (
                <div className="text-center text-gray-500">
                  No performance data available
                </div>
              )}
            </Suspense>
          </div>
        </div>

        {/* Quick Stats */}
        {userProgress && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="bg-emerald-50 p-2 rounded">
              <div className="text-sm text-gray-600">Total Score</div>
              <div className="text-lg font-bold text-emerald-600">{userProgress.totalScore}</div>
            </div>
            <div className="bg-blue-50 p-2 rounded">
              <div className="text-sm text-gray-600">Success Rate</div>
              <div className="text-lg font-bold text-blue-600">
                {((userProgress.correctAnswers / Math.max(userProgress.gamesPlayed, 1)) * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
