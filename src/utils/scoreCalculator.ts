import { Task, DailyScoreBreakdown, ScoreBand } from '../types';

export function calculateDailyScore(tasksForDate: Task[], targetDate: string, allTasks: Task[] = []): DailyScoreBreakdown {
  // Exclude availability blocks from score calculation
  const regularTasks = tasksForDate.filter(t => t.category !== 'availability_block');

  if (regularTasks.length === 0) {
    return {
      mustDoScore: 0,
      studyTimeScore: 0,
      practiceScore: 0,
      revisionScore: 0,
      planningHygieneScore: 0,
      total: 0,
      band: 'Fresh start / No plan yet',
      explanation: 'No tasks planned yet. Add one small task to start your study momentum today.',
      hasTasks: false,
    };
  }

  // 1. Task Completion (Max 45 pts)
  // Priority Weights: Must do = 4, Should do = 2, Optional = 1
  let totalWeightedPossible = 0;
  let totalWeightedEarned = 0;
  let mustDoCount = 0;
  let mustDoCompleted = 0;

  regularTasks.forEach(task => {
    let weight = 1;
    if (task.priority === 'Must do') {
      weight = 4;
      mustDoCount++;
    } else if (task.priority === 'Should do') {
      weight = 2;
    } else {
      weight = 0.8; // Prevent inflating score with tiny optional tasks
    }

    totalWeightedPossible += weight;

    if (task.status === 'Completed') {
      totalWeightedEarned += weight;
      if (task.priority === 'Must do') mustDoCompleted++;
    } else if (task.status === 'Partially complete') {
      const ratio = task.targetValue > 0
        ? Math.min(1, Math.max(0, task.currentCompletedValue / task.targetValue))
        : 0.5;
      totalWeightedEarned += weight * ratio;
      if (task.priority === 'Must do' && ratio >= 0.75) mustDoCompleted += 0.5;
    }
  });

  const completionFraction = totalWeightedPossible > 0 ? (totalWeightedEarned / totalWeightedPossible) : 0;
  const mustDoScore = Math.round(completionFraction * 45);

  // 2. Study Time Score (Max 25 pts)
  let plannedMinutes = 0;
  let actualMinutes = 0;

  regularTasks.forEach(task => {
    plannedMinutes += task.plannedDurationMinutes || 0;
    actualMinutes += task.actualCompletedDurationMinutes || 0;
  });

  let studyTimeFraction = 0;
  if (plannedMinutes > 0) {
    // Up to 100% of planned minutes
    studyTimeFraction = Math.min(1, actualMinutes / plannedMinutes);
  } else if (actualMinutes > 0) {
    // If no planned duration but studied
    studyTimeFraction = Math.min(1, actualMinutes / 60);
  }
  const studyTimeScore = Math.round(studyTimeFraction * 25);

  // 3. Practice Quality / Accuracy Score (Max 15 pts)
  // Calculate average accuracy among practice tasks with questions attempted
  const practiceTasks = regularTasks.filter(
    t => (t.taskType === 'Practice' || t.taskType === 'Mock test' || t.taskType === 'Mock analysis') &&
         (t.attemptedQuestions && t.attemptedQuestions > 0)
  );

  let practiceScore = 0;
  if (practiceTasks.length > 0) {
    let totalAcc = 0;
    practiceTasks.forEach(t => {
      const acc = t.calculatedAccuracy ?? ((t.correctAnswers || 0) / (t.attemptedQuestions || 1)) * 100;
      totalAcc += Math.min(100, Math.max(0, acc));
    });
    const avgAccuracy = totalAcc / practiceTasks.length;
    // Scale 50% - 95% to 0 - 15 points
    const qualityNorm = Math.min(1, Math.max(0, (avgAccuracy - 40) / 50));
    practiceScore = Math.round(qualityNorm * 15);
  } else {
    // If no questions tracking, evaluate target completion ratio
    const measurableTasks = regularTasks.filter(t => t.targetValue > 0);
    if (measurableTasks.length > 0) {
      const avgTargetRatio = measurableTasks.reduce((acc, t) => {
        return acc + Math.min(1, t.currentCompletedValue / (t.targetValue || 1));
      }, 0) / measurableTasks.length;
      practiceScore = Math.round(avgTargetRatio * 15);
    } else {
      // General completion proxy
      practiceScore = Math.round(completionFraction * 15);
    }
  }

  // 4. Revision Consistency (Max 10 pts)
  const revisionTasks = regularTasks.filter(t => t.subject === 'Revision' || t.taskType === 'Revise');
  let revisionScore = 0;
  if (revisionTasks.length > 0) {
    const revCompleted = revisionTasks.filter(t => t.status === 'Completed').length;
    const revPartial = revisionTasks.filter(t => t.status === 'Partially complete').length;
    const revRatio = (revCompleted + revPartial * 0.5) / revisionTasks.length;
    revisionScore = Math.round(revRatio * 10);
  } else {
    // If no revision was required today, grant baseline 7 points if overall completion is healthy
    revisionScore = completionFraction >= 0.5 ? 8 : Math.round(completionFraction * 8);
  }

  // 5. Planning Hygiene (Max 5 pts)
  // Check if future tasks exist or no overdue tasks left unresolved
  const overdueUnresolved = regularTasks.filter(t => t.status === 'Overdue').length;
  let planningHygieneScore = 5;
  if (overdueUnresolved > 2) {
    planningHygieneScore = 1;
  } else if (overdueUnresolved > 0) {
    planningHygieneScore = 3;
  }

  const rawTotal = mustDoScore + studyTimeScore + practiceScore + revisionScore + planningHygieneScore;
  const total = Math.max(0, Math.min(100, rawTotal));

  let band: ScoreBand = 'Fresh start / No plan yet';
  if (total >= 85) band = 'Excellent';
  else if (total >= 70) band = 'On track';
  else if (total >= 45) band = 'Recoverable';
  else band = 'At risk';

  // Build transparent plain-language summary
  const completedCount = regularTasks.filter(t => t.status === 'Completed').length;
  let explanation = `Your score is ${total}/100. `;
  if (mustDoCount > 0) {
    explanation += `Completed ${Math.floor(mustDoCompleted)} of ${mustDoCount} priority tasks, `;
  } else {
    explanation += `Completed ${completedCount} of ${regularTasks.length} tasks, `;
  }
  explanation += `studied ${actualMinutes} of ${plannedMinutes} planned minutes.`;
  if (overdueUnresolved > 0) {
    explanation += ` ${overdueUnresolved} overdue tasks remain to be rebalanced.`;
  }

  return {
    mustDoScore,
    studyTimeScore,
    practiceScore,
    revisionScore,
    planningHygieneScore,
    total,
    band,
    explanation,
    hasTasks: true,
  };
}
