import { completeTopicXp } from './xp.js';
import { checkAchievements } from './achievements.js';
import { saveData } from '../utils/storage.js';

export function toggleTopicCompleted(appState, currentSubject, categoryId, topicIndex) {
    if (!currentSubject) return false;
    
    const category = currentSubject.categories.find(c => c.id === categoryId);
    if (!category) return false;
    
    const topic = category.topics[topicIndex];
    if (!topic) return false;

    const now = Date.now();
    const wasCompleted = !!topic.completed;
    
    if (!wasCompleted) {
        // Completar tema
        topic.completed = true;
        topic.completedAt = now;
        topic.reviews = [];
        completeTopicXp(appState, currentSubject, 22);
        checkAchievements(appState, { activity: 'topic', currentSubject, nowMs: Date.now() });
    } else {
        // Desmarcar tema completado
        topic.completed = false;
        topic.completedAt = null;
        topic.reviews = [];
        saveData(appState, true);
    }

    return true;
}

export function getCompletionStats(subject) {
    if (!subject) return { total: 0, completed: 0, percentage: 0 };
    
    let totalTopics = 0;
    let completedTopics = 0;
    
    for (const category of subject.categories) {
        totalTopics += category.topics.length;
        completedTopics += category.topics.filter(t => t.completed).length;
    }
    
    const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    return {
        total: totalTopics,
        completed: completedTopics,
        percentage
    };
}

export function getGlobalCompletionStats(appState) {
    let totalTopics = 0;
    let completedTopics = 0;
    
    for (const subject of appState.subjects) {
        for (const category of subject.categories) {
            totalTopics += category.topics.length;
            completedTopics += category.topics.filter(t => t.completed).length;
        }
    }
    
    const percentage = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
    
    return {
        total: totalTopics,
        completed: completedTopics,
        percentage
    };
}
