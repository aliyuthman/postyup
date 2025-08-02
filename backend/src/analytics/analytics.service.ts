import { Injectable } from '@nestjs/common';
import { db } from '../db/connection';
import { analytics, type NewAnalytics } from '../db/schema';

@Injectable()
export class AnalyticsService {
  async trackAction(
    sessionId: string,
    actionType: string,
    templateId?: string
  ): Promise<void> {
    try {
      const analyticsData: NewAnalytics = {
        sessionId,
        actionType,
        templateId: templateId || null,
      };

      await db.insert(analytics).values(analyticsData);
    } catch (error) {
      console.error('Analytics tracking error:', error);
      // Don't throw error to avoid disrupting user flow
    }
  }

  async getAnalyticsSummary() {
    try {
      const results = await db
        .select({
          actionType: analytics.actionType,
          count: analytics.id,
        })
        .from(analytics);

      // Group by action type and count
      const summary = results.reduce((acc, row) => {
        acc[row.actionType] = (acc[row.actionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return summary;
    } catch (error) {
      console.error('Analytics summary error:', error);
      return {};
    }
  }
}