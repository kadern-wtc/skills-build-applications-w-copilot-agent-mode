import { useApiData } from '../api/useApiData.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };
type LeaderboardResponse = { leaderboard: LeaderboardEntry[] };

export default function Leaderboard() {
  const state = useApiData<LeaderboardResponse>('/api/leaderboard');
  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {state.status === 'loading' && <p role="status">Loading leaderboard...</p>}
    {state.status === 'error' && <p role="alert">Unable to load leaderboard: {state.message}</p>}
    {state.status === 'success' && (state.data.leaderboard.length === 0
      ? <p>No leaderboard rankings yet.</p>
      : <ol className="list-group list-group-numbered">{state.data.leaderboard.map((entry) => <li className="list-group-item" key={entry.teamName}>
        <strong>{entry.teamName}</strong>: {entry.totalPoints} points
      </li>)}</ol>)}
  </div></section>;
}
