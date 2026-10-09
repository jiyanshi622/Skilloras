"""
Skillora Personalization & Knowledge Engine
Deterministic scoring, Bayesian Knowledge Tracing (BKT), adaptive timetable generation,
and topic strength/weakness classification algorithms.
"""

from typing import List, Dict, Any, Tuple
import math

class PersonalizationEngine:
    # Bayesian Knowledge Tracing default priors
    DEFAULT_PRIOR = 0.20       # Prior probability of knowing skill before observation
    PROB_TRANSIT = 0.15        # Probability of transition from unlearned to learned state
    PROB_GUESS = 0.25          # Probability of guessing correctly without knowing
    PROB_SLIP = 0.10           # Probability of slipping (incorrect despite knowing)

    @staticmethod
    def calculate_knowledge_level(overall_accuracy: float, hard_accuracy: float) -> str:
        """Determines estimated student proficiency category based on performance."""
        if overall_accuracy >= 88.0 and hard_accuracy >= 70.0:
            return "Master"
        elif overall_accuracy >= 75.0:
            return "Proficient"
        elif overall_accuracy >= 60.0:
            return "Competent"
        elif overall_accuracy >= 40.0:
            return "Developing"
        else:
            return "Novice"

    @classmethod
    def update_bayesian_mastery(cls, current_mastery: float, is_correct: bool) -> float:
        """
        Updates topic mastery using Bayesian Knowledge Tracing (BKT) formulation:
        P(L_t | action) = P(L_t-1) * P(action|learned) / P(action)
        P(L_t) = P(L_t | action) + (1 - P(L_t | action)) * P(Transit)
        """
        prior = max(0.05, min(0.95, current_mastery / 100.0 if current_mastery > 0 else cls.DEFAULT_PRIOR))
        
        if is_correct:
            numerator = prior * (1.0 - cls.PROB_SLIP)
            denominator = numerator + (1.0 - prior) * cls.PROB_GUESS
        else:
            numerator = prior * cls.PROB_SLIP
            denominator = numerator + (1.0 - prior) * (1.0 - cls.PROB_GUESS)

        posterior = numerator / max(0.0001, denominator)
        new_learned_prob = posterior + (1.0 - posterior) * cls.PROB_TRANSIT
        return round(min(100.0, max(5.0, new_learned_prob * 100.0)), 1)

    @classmethod
    def evaluate_submission(
        cls,
        questions_map: Dict[str, Any],
        student_answers: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Evaluates assessment/quiz answers, computes topic-wise metrics,
        and difficulty-weighted accuracy.
        """
        total_questions = len(student_answers)
        correct_count = 0
        topic_stats: Dict[str, Dict[str, Any]] = {}
        difficulty_counts = {"easy": [0, 0], "medium": [0, 0], "hard": [0, 0]} # [correct, total]

        for ans in student_answers:
            qid = ans.get("question_id")
            selected_idx = ans.get("selected_option_index")
            question = questions_map.get(qid)
            if not question:
                continue

            topic_id = question.get("topic_id", "general")
            difficulty = question.get("difficulty", "medium").lower()
            is_correct = (selected_idx == question.get("correct_option_index"))

            if is_correct:
                correct_count += 1

            # Difficulty tracking
            if difficulty in difficulty_counts:
                difficulty_counts[difficulty][1] += 1
                if is_correct:
                    difficulty_counts[difficulty][0] += 1

            # Topic tracking
            if topic_id not in topic_stats:
                topic_stats[topic_id] = {
                    "total": 0,
                    "correct": 0,
                    "topic_id": topic_id,
                    "subject_id": question.get("subject_id")
                }
            topic_stats[topic_id]["total"] += 1
            if is_correct:
                topic_stats[topic_id]["correct"] += 1

        score_pct = (correct_count / total_questions * 100.0) if total_questions > 0 else 0.0
        
        # Calculate hard accuracy
        hard_total = difficulty_counts["hard"][1]
        hard_acc = (difficulty_counts["hard"][0] / hard_total * 100.0) if hard_total > 0 else score_pct

        calculated_level = cls.calculate_knowledge_level(score_pct, hard_acc)

        # Build evaluated topic metrics
        evaluated_topics = []
        for tid, data in topic_stats.items():
            acc = (data["correct"] / data["total"] * 100.0) if data["total"] > 0 else 0.0
            evaluated_topics.append({
                "topic_id": tid,
                "subject_id": data["subject_id"],
                "total": data["total"],
                "correct": data["correct"],
                "accuracy": round(acc, 1)
            })

        return {
            "total_questions": total_questions,
            "correct_count": correct_count,
            "score_percentage": round(score_pct, 1),
            "calculated_level": calculated_level,
            "difficulty_breakdown": difficulty_counts,
            "topic_metrics": evaluated_topics
        }

    @staticmethod
    def classify_strengths_and_weaknesses(
        performances: List[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
        """
        Classifies topics into Strengths, Needs Revision (Weaknesses), and Developing.
        """
        strengths = []
        weaknesses = []
        developing = []

        for p in performances:
            acc = p.get("accuracy_percentage", 0.0)
            mastery = p.get("mastery_score", 0.0)
            status = p.get("status", "developing")

            if acc >= 75.0 or mastery >= 80.0:
                strengths.append(p)
            elif acc < 55.0 or status == "needs_revision" or mastery < 45.0:
                weaknesses.append(p)
            else:
                developing.append(p)

        # Sort strengths descending, weaknesses ascending (worst first)
        strengths.sort(key=lambda x: x.get("accuracy_percentage", 0), reverse=True)
        weaknesses.sort(key=lambda x: x.get("accuracy_percentage", 0))
        return strengths, weaknesses, developing

    @staticmethod
    def select_recommended_difficulty(topic_accuracy: float, mastery: float) -> str:
        """Determines next drill difficulty level for a topic."""
        if topic_accuracy >= 80.0 and mastery >= 75.0:
            return "hard"
        elif topic_accuracy >= 50.0:
            return "medium"
        else:
            return "easy"

    @classmethod
    def generate_study_timetable(
        cls,
        user_id: str,
        preferred_daily_hours: float,
        topics: List[Dict[str, Any]],
        performances: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Generates a balanced 7-day study timetable matching student daily hour preferences.
        Weak topics receive revision slots; in-progress topics receive practice drills;
        new topics receive concept study.
        """
        days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        strengths, weaknesses, developing = cls.classify_strengths_and_weaknesses(performances)

        # Create quick lookup by topic_id
        perf_map = {p["topic_id"]: p for p in performances}
        slots_per_day = max(1, min(3, int(round(preferred_daily_hours / 0.75))))

        timetable = []
        time_slot_templates = ["09:00 - 09:45", "14:00 - 14:45", "19:00 - 19:45"]

        # Pool of topic candidates
        weak_topic_ids = [w["topic_id"] for w in weaknesses]
        dev_topic_ids = [d["topic_id"] for d in developing]
        all_topic_ids = [t["id"] for t in topics]

        topic_index = 0
        for day_idx, day in enumerate(days):
            for slot_idx in range(slots_per_day):
                time_slot = time_slot_templates[slot_idx % len(time_slot_templates)]
                
                # Alternate between revision, concept study, and practice drill
                if slot_idx == 0 and weak_topic_ids:
                    # Target weak topic for revision
                    selected_topic_id = weak_topic_ids[(day_idx) % len(weak_topic_ids)]
                    activity_type = "revision"
                elif dev_topic_ids and (day_idx % 2 == 1):
                    selected_topic_id = dev_topic_ids[(day_idx + slot_idx) % len(dev_topic_ids)]
                    activity_type = "practice_drill"
                else:
                    selected_topic_id = all_topic_ids[topic_index % len(all_topic_ids)]
                    topic_index += 1
                    activity_type = "concept_study"

                # Find topic metadata
                topic_info = next((t for t in topics if t["id"] == selected_topic_id), None)
                if not topic_info and topics:
                    topic_info = topics[0]

                timetable.append({
                    "id": f"slot_{day.lower()}_{slot_idx}",
                    "user_id": user_id,
                    "day_of_week": day,
                    "time_slot": time_slot,
                    "subject_id": topic_info["subject_id"] if topic_info else "",
                    "topic_id": topic_info["id"] if topic_info else "",
                    "topic_title": topic_info["title"] if topic_info else "General Study",
                    "duration_minutes": 45,
                    "activity_type": activity_type,
                    "is_completed": False
                })

        return timetable

    @staticmethod
    def generate_recommendations(
        weaknesses: List[Dict[str, Any]],
        developing: List[Dict[str, Any]],
        topics: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Generates clear pedagogical recommendations based on current student performance."""
        recommendations = []
        topic_map = {t["id"]: t for t in topics}

        # 1. Urgent revisions for weak topics
        for idx, w in enumerate(weaknesses[:3]):
            topic_meta = topic_map.get(w.get("topic_id"), {})
            title = topic_meta.get("title", "Topic")
            recommendations.append({
                "id": f"rec_weak_{idx}",
                "topic_id": w.get("topic_id"),
                "topic_title": title,
                "recommendation_type": "urgent_revision",
                "priority": 1,
                "reason": f"Accuracy is {w.get('accuracy_percentage', 0)}%. Review core concept notes and run an adaptive drill to rebuild retention."
            })

        # 2. Next progression for developing topics
        for idx, d in enumerate(developing[:2]):
            topic_meta = topic_map.get(d.get("topic_id"), {})
            title = topic_meta.get("title", "Topic")
            recommendations.append({
                "id": f"rec_dev_{idx}",
                "topic_id": d.get("topic_id"),
                "topic_title": title,
                "recommendation_type": "reinforcement_drill",
                "priority": 2,
                "reason": f"Mastery score reached {d.get('mastery_score', 0)}%. Complete a medium-difficulty quiz to progress to Proficient level."
            })

        # 3. Next advancement
        if not recommendations and topics:
            recommendations.append({
                "id": "rec_adv_1",
                "topic_id": topics[0]["id"],
                "topic_title": topics[0]["title"],
                "recommendation_type": "next_progression",
                "priority": 3,
                "reason": "Strong performance across current subjects! Ready to unlock the next chapter in your curriculum."
            })

        return recommendations
