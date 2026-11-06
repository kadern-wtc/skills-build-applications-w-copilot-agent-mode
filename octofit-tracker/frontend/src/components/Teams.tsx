import { useApiData } from '../api/useApiData.js';

type Team = { _id?: string; name: string; mascot: string; members: string[] };
type TeamResponse = { teams: Team[] };

export default function Teams() {
  const state = useApiData<TeamResponse>('/api/teams');
  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Teams</h2>
    <p>Manage teams and members.</p>
    {state.status === 'loading' && <p role="status">Loading teams...</p>}
    {state.status === 'error' && <p role="alert">Unable to load teams: {state.message}</p>}
    {state.status === 'success' && (state.data.teams.length === 0
      ? <p>No teams yet.</p>
      : <ul className="list-group">{state.data.teams.map((team, index) => <li className="list-group-item" key={team._id ?? `${team.name}-${index}`}>
        <strong>{team.name}</strong> ({team.mascot})<br />
        Members: {team.members.join(', ') || 'No members'}
      </li>)}</ul>)}
  </div></section>;
}
