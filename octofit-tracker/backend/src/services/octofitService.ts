import { Activity, Team, User, Workout } from '../models/index.js';
import { Types } from 'mongoose';

type Input = Record<string, unknown>;

function isInput(value: unknown): value is Input {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requestError(message: string, status = 400) {
  return Object.assign(new Error(message), { status });
}

function requiredText(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw requestError(`${field} is required`);
  }
  return value.trim();
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!isInput(input)) throw requestError('Activity details are required');
  const userId = requiredText(input.userId, 'userId');
  const teamId = requiredText(input.teamId, 'teamId');
  const type = requiredText(input.type, 'type');
  const minutes = input.minutes;
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(teamId)) {
    throw requestError('userId and teamId must be valid IDs');
  }
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes <= 0) {
    throw requestError('minutes must be a positive number');
  }

  const [user, team] = await Promise.all([User.exists({ _id: userId }), Team.exists({ _id: teamId })]);
  if (!user || !team) throw requestError('The referenced user or team does not exist', 404);

  return Activity.create({
    user: userId,
    team: teamId,
    type,
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!isInput(input)) throw requestError('Team details are required');
  const name = requiredText(input.name, 'name');
  const mascot = requiredText(input.mascot, 'mascot');
  const memberIds = input.members ?? [];
  if (!Array.isArray(memberIds) || memberIds.some((memberId) => typeof memberId !== 'string' || !Types.ObjectId.isValid(memberId))) {
    throw requestError('members must be an array of valid user IDs');
  }
  const members = memberIds as string[];
  if (members.length > 0) {
    const existingMembers = await User.countDocuments({ _id: { $in: members } });
    if (existingMembers !== new Set(members).size) throw requestError('One or more members do not exist', 404);
  }
  return Team.create({ name, mascot, members });
}

export async function getLeaderboard() {
  const [teams, pointTotals] = await Promise.all([
    Team.find().lean(),
    Activity.aggregate<{ _id: Types.ObjectId; totalPoints: number }>([
      { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    ]),
  ]);
  const totalsByTeam = new Map(pointTotals.map(({ _id, totalPoints }) => [_id.toString(), totalPoints]));
  return teams
    .map((team) => ({ teamName: team.name, totalPoints: totalsByTeam.get(team._id.toString()) ?? 0 }))
    .sort((left, right) => right.totalPoints - left.totalPoints || left.teamName.localeCompare(right.teamName))
    .map((team, index) => ({ ...team, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail.trim().toLowerCase() }).lean();
  if (!user) throw requestError('User not found', 404);

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const activityFocus = recentActivities[0]?.type.toLowerCase();
  const preferredFocus = user.fitnessGoal || activityFocus;
  const workouts = await Workout.find().lean();
  const orderedWorkouts = [...workouts].sort((left, right) => {
    const leftMatches = left.focus.toLowerCase() === preferredFocus?.toLowerCase();
    const rightMatches = right.focus.toLowerCase() === preferredFocus?.toLowerCase();
    return Number(rightMatches) - Number(leftMatches) || left.title.localeCompare(right.title);
  });

  return orderedWorkouts.map((workout) => ({
    ...workout,
    reason: workout.focus.toLowerCase() === preferredFocus?.toLowerCase()
      ? `Recommended for your ${preferredFocus} fitness goal${activityFocus ? ` and recent ${activityFocus} activity` : ''}.`
      : `Recommended as an alternative to your ${preferredFocus} fitness goal.`,
  }));
}

export { User };
