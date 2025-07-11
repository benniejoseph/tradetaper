'use client';

import { useState, useEffect } from 'react';
import { psychologyService } from '@/services/psychology.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Define types for the data we expect from the API
interface PsychologicalInsight {
  id: string;
  insightType: string;
  sentiment: string;
  confidenceScore: number;
  extractedText: string;
  analysisDate: string;
}

interface ProfileSummary {
  totalInsights: number;
  insightTypeCounts: Record<string, number>;
  sentimentCounts: Record<string, number>;
  averageConfidence: number;
}

export default function PsychologyProfilePage() {
  const [profile, setProfile] = useState<PsychologicalInsight[]>([]);
  const [summary, setSummary] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, summaryData] = await Promise.all([
          psychologyService.getProfile(),
          psychologyService.getProfileSummary(),
        ]);
        setProfile(profileData);
        setSummary(summaryData);
        setError(null);
      } catch (err) {
        setError('Failed to load psychological profile. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const insightTypeChartData = summary
    ? Object.entries(summary.insightTypeCounts).map(([name, value]) => ({ name, count: value }))
    : [];

  const sentimentChartData = summary
    ? Object.entries(summary.sentimentCounts).map(([name, value]) => ({ name, count: value }))
    : [];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <p>Loading psychological profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-3xl font-bold mb-6">Psychological Profile</h1>

      {summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Total Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.totalInsights}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Avg. Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{(summary.averageConfidence * 100).toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Insights by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insightTypeChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sentimentChartData}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {profile.map((insight) => (
              <div key={insight.id} className="p-4 border rounded-lg">
                <p className="font-semibold">{insight.insightType}</p>
                <p className="text-sm text-gray-500">{new Date(insight.analysisDate).toLocaleDateString()}</p>
                <p className="italic">"{insight.extractedText}"</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm">Sentiment: {insight.sentiment}</span>
                  <span className="text-sm">Confidence: {(insight.confidenceScore * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 