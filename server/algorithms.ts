import { KnowledgeLevel, Difficulty, PerformanceStatus } from '../src/types/index.ts';

export class PersonalizationEngine {
  // Bayesian Knowledge Tracing default constants
  static DEFAULT_PRIOR = 0.20;
  static PROB_TRANSIT = 0.15;
  static PROB_GUESS = 0.25;
  static PROB_SLIP = 0.10;

  static calculateKnowledgeLevel(overallAccuracy: number, hardAccuracy: number): KnowledgeLevel {
    if (overallAccuracy >= 88.0 && hardAccuracy >= 65.0) {
      return 'Master';
    } else if (overallAccuracy >= 75.0) {
      return 'Proficient';
    } else if (overallAccuracy >= 60.0) {
      return 'Competent';
    } else if (overallAccuracy >= 40.0) {
      return 'Developing';
    } else {
      return 'Novice';
    }
  }

  static updateBayesianMastery(currentMastery: number, isCorrect: boolean): number {
    const prior = Math.max(0.05, Math.min(0.95, currentMastery > 0 ? currentMastery / 100 : this.DEFAULT_PRIOR));
    let numerator: number;
    let denominator: number;

    if (isCorrect) {
      numerator = prior * (1.0 - this.PROB_SLIP);
      denominator = numerator + (1.0 - prior) * this.PROB_GUESS;
    } else {
      numerator = prior * this.PROB_SLIP;
      denominator = numerator + (1.0 - prior) * (1.0 - this.PROB_GUESS);
    }

    const posterior = numerator / Math.max(0.0001, denominator);
    const newLearnedProb = posterior + (1.0 - posterior) * this.PROB_TRANSIT;
    return Math.round(Math.min(100.0, Math.max(5.0, newLearnedProb * 100.0)) * 10) / 10;
  }

  static selectRecommendedDifficulty(topicAccuracy: number, mastery: number): Difficulty {
    if (topicAccuracy >= 80.0 && mastery >= 75.0) {
      return 'hard';
    } else if (topicAccuracy >= 50.0) {
      return 'medium';
    } else {
      return 'easy';
    }
  }

  static classifyStrengthsAndWeaknesses(performances: any[]): {
    strengths: any[];
    weaknesses: any[];
    developing: any[];
  } {
    const strengths: any[] = [];
    const weaknesses: any[] = [];
    const developing: any[] = [];

    for (const p of performances) {
      const acc = p.accuracyPercentage || 0;
      const mastery = p.masteryScore || 0;
      const status = p.status || 'developing';

      if (acc >= 75 || mastery >= 80) {
        strengths.push(p);
      } else if (acc < 55 || status === 'needs_revision' || mastery < 45) {
        weaknesses.push(p);
      } else {
        developing.push(p);
      }
    }

    strengths.sort((a, b) => (b.accuracyPercentage || 0) - (a.accuracyPercentage || 0));
    weaknesses.sort((a, b) => (a.accuracyPercentage || 0) - (b.accuracyPercentage || 0));
    return { strengths, weaknesses, developing };
  }

  static generateStudyTimetable(
    userId: string,
    preferredDailyHours: number,
    topics: any[],
    performances: any[]
  ): any[] {
    const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday')[] = [
      'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
    ];
    const { weaknesses, developing } = this.classifyStrengthsAndWeaknesses(performances);

    const slotsPerDay = Math.max(1, Math.min(3, Math.round(preferredDailyHours / 0.75)));
    const timeSlots = ['09:00 - 09:45', '14:00 - 14:45', '19:00 - 19:45'];
    const weakTopicIds = weaknesses.map(w => w.topicId);
    const devTopicIds = developing.map(d => d.topicId);
    const allTopicIds = topics.map(t => t.id);

    const timetable: any[] = [];
    let topicIndex = 0;

    days.forEach((day, dayIdx) => {
      for (let slotIdx = 0; slotIdx < slotsPerDay; slotIdx++) {
        const timeSlot = timeSlots[slotIdx % timeSlots.length];
        let selectedTopicId = '';
        let activityType = 'concept_study';

        if (slotIdx === 0 && weakTopicIds.length > 0) {
          selectedTopicId = weakTopicIds[dayIdx % weakTopicIds.length];
          activityType = 'revision';
        } else if (devTopicIds.length > 0 && dayIdx % 2 === 1) {
          selectedTopicId = devTopicIds[(dayIdx + slotIdx) % devTopicIds.length];
          activityType = 'practice_drill';
        } else {
          selectedTopicId = allTopicIds[topicIndex % (allTopicIds.length || 1)];
          topicIndex++;
          activityType = 'concept_study';
        }

        const topicInfo = topics.find(t => t.id === selectedTopicId) || topics[0];

        timetable.push({
          id: `slot_${day.toLowerCase()}_${slotIdx}`,
          userId,
          dayOfWeek: day,
          timeSlot,
          subjectId: topicInfo?.subjectId || '',
          topicId: topicInfo?.id || '',
          topicTitle: topicInfo?.title || 'Fundamentals',
          durationMinutes: 45,
          activityType,
          isCompleted: false
        });
      }
    });

    return timetable;
  }

  static generateRecommendations(
    weaknesses: any[],
    developing: any[],
    topics: any[]
  ): any[] {
    const recommendations: any[] = [];
    const topicMap = new Map(topics.map(t => [t.id, t]));

    // Urgent revisions
    weaknesses.slice(0, 3).forEach((w, idx) => {
      const topic = topicMap.get(w.topicId);
      recommendations.push({
        id: `rec_weak_${idx}`,
        topicId: w.topicId,
        topicTitle: topic?.title || 'Core Topic',
        recommendationType: 'urgent_revision',
        priority: 1,
        reason: `Current retention is ${w.accuracyPercentage || 0}%. Targeted revision recommended to solidify baseline fundamentals.`
      });
    });

    // Reinforcement drills
    developing.slice(0, 2).forEach((d, idx) => {
      const topic = topicMap.get(d.topicId);
      recommendations.push({
        id: `rec_dev_${idx}`,
        topicId: d.topicId,
        topicTitle: topic?.title || 'In-Progress Concept',
        recommendationType: 'reinforcement_drill',
        priority: 2,
        reason: `Mastery score reached ${d.masteryScore || 0}%. Complete an adaptive challenge to level up to Proficient.`
      });
    });

    if (recommendations.length === 0 && topics.length > 0) {
      recommendations.push({
        id: 'rec_adv_0',
        topicId: topics[0].id,
        topicTitle: topics[0].title,
        recommendationType: 'next_progression',
        priority: 3,
        reason: 'Excellent proficiency! Proceed to the next curriculum milestone.'
      });
    }

    return recommendations;
  }

  static generateWeakTopicActionIdeas(
    weaknesses: any[],
    topics: any[],
    subjects?: any[]
  ): any[] {
    const topicMap = new Map(topics.map(t => [t.id, t]));
    const subjectMap = new Map((subjects || []).map((s: any) => [s.id, s.title]));

    return weaknesses.map((w) => {
      const topic = topicMap.get(w.topicId);
      const title = topic?.title || w.topicTitle || 'Key Concept';
      const subjectTitle = subjectMap.get(topic?.subjectId || w.subjectId) || 'Foundational Subject';
      const acc = Math.round(w.accuracyPercentage || 0);
      const urgency: 'critical' | 'high' | 'medium' = acc < 35 ? 'critical' : acc < 55 ? 'high' : 'medium';

      return {
        topicId: w.topicId,
        topicTitle: title,
        subjectTitle,
        accuracyPercentage: acc,
        masteryScore: Math.round(w.masteryScore || 0),
        urgencyLevel: urgency,
        shortReason: acc < 35
          ? `High vulnerability detected (${acc}% accuracy). Fundamental concepts require step-by-step rebuild.`
          : `Retention gap identified (${acc}% accuracy). Targeted revision and deliberate drill recommended.`,
        ideas: [
          {
            title: `Generate AI Study Notes for ${title}`,
            description: `Review beginner-friendly definitions, visual step-by-step traces, and core invariants in English, Hindi, or Gujarati.`,
            actionType: 'notes',
            targetTopicId: w.topicId,
            targetTopicTitle: title
          },
          {
            title: `Solve a 5-Question Drill on ${title}`,
            description: `Practice adaptive questions targeting the exact misconceptions from this assessment session.`,
            actionType: 'drill',
            targetTopicId: w.topicId,
            targetTopicTitle: title
          },
          {
            title: `Watch Curated Video Explanation`,
            description: `Watch a high-yield YouTube lesson with visual derivations to rebuild your intuition.`,
            actionType: 'video',
            targetTopicId: w.topicId,
            targetTopicTitle: title
          },
          {
            title: `Schedule 45-min Revision Slot`,
            description: `Add a dedicated spaced repetition block to your weekly study timetable.`,
            actionType: 'timetable',
            targetTopicId: w.topicId,
            targetTopicTitle: title
          }
        ]
      };
    });
  }

  static computeQuizAnalytics(
    evaluatedAnswers: any[],
    questions: any[],
    durationSeconds: number,
    topics: any[],
    performances: any[]
  ): any {
    const total = evaluatedAnswers.length || 1;
    const correct = evaluatedAnswers.filter(a => a.isCorrect).length;
    const scorePct = Math.round((correct / total) * 100);
    const avgSecsPerQ = Math.round(durationSeconds / total);

    const diffStats = {
      easy: { correct: 0, total: 0 },
      medium: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 }
    };

    const qMap = new Map(questions.map(q => [q.id, q]));
    evaluatedAnswers.forEach(ans => {
      const q = qMap.get(ans.questionId);
      const diff = (q?.difficulty || 'medium') as 'easy' | 'medium' | 'hard';
      if (diffStats[diff]) {
        diffStats[diff].total++;
        if (ans.isCorrect) diffStats[diff].correct++;
      }
    });

    const { strengths, weaknesses } = this.classifyStrengthsAndWeaknesses(performances);
    const topicMap = new Map(topics.map(t => [t.id, t]));

    const enrichedStrengths = strengths.slice(0, 4).map(s => ({
      topicId: s.topicId,
      topicTitle: topicMap.get(s.topicId)?.title || s.topicTitle || 'Concept',
      accuracyPercentage: Math.round(s.accuracyPercentage || 0),
      masteryScore: Math.round(s.masteryScore || 0)
    }));

    const enrichedWeaknesses = weaknesses.slice(0, 4).map(w => ({
      topicId: w.topicId,
      topicTitle: topicMap.get(w.topicId)?.title || w.topicTitle || 'Concept',
      accuracyPercentage: Math.round(w.accuracyPercentage || 0),
      masteryScore: Math.round(w.masteryScore || 0)
    }));

    const actionIdeas = this.generateWeakTopicActionIdeas(weaknesses, topics);

    return {
      scorePercentage: scorePct,
      correctCount: correct,
      totalQuestions: total,
      durationSeconds,
      averageSecondsPerQuestion: avgSecsPerQ,
      difficultyBreakdown: diffStats,
      strengths: enrichedStrengths,
      weaknesses: enrichedWeaknesses,
      actionIdeas
    };
  }
}
