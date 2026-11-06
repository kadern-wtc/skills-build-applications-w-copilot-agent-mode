import { useApiData } from '../api/useApiData.js';

type Workout = { title: string; focus: string; minutes: number; difficulty: string; reason: string };
type WorkoutResponse = { suggestions: Workout[] };

export default function Workouts() {
  const userEmail = 'mona@example.com';
  const state = useApiData<WorkoutResponse>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    {state.status === 'loading' && <p role="status">Loading workout suggestions...</p>}
    {state.status === 'error' && <p role="alert">Unable to load workout suggestions: {state.message}</p>}
    {state.status === 'success' && (state.data.suggestions.length === 0
      ? <p>No workout suggestions yet.</p>
      : <ul className="list-group">{state.data.suggestions.map((workout) => <li className="list-group-item" key={workout.title}>
        <strong>{workout.title}</strong>: {workout.focus}, {workout.minutes} minutes, {workout.difficulty}. {workout.reason}
      </li>)}</ul>)}
  </div></section>;
}
